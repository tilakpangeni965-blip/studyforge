-- Practice quizzes are generated on the server and scored in the database.
-- Paid access is read only from Supabase's trusted app_metadata claim.

create table if not exists public.practice_quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  topic text not null check (char_length(topic) between 2 and 120),
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) in (5, 10)),
  created_at timestamptz not null default now()
);

create table if not exists public.practice_quiz_generation_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid references public.practice_quizzes(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists practice_quizzes_user_created_idx on public.practice_quizzes(user_id, created_at desc);
create index if not exists practice_quiz_usage_user_created_idx on public.practice_quiz_generation_usage(user_id, created_at desc);

create table if not exists public.practice_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.practice_quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'array'),
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  completed_at timestamptz not null default now()
);

create index if not exists practice_attempts_user_completed_idx on public.practice_quiz_attempts(user_id, completed_at desc);

alter table public.practice_quizzes enable row level security;
alter table public.practice_quiz_generation_usage enable row level security;
alter table public.practice_quiz_attempts enable row level security;

drop policy if exists "Students read own practice quizzes" on public.practice_quizzes;
create policy "Students read own practice quizzes" on public.practice_quizzes for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Students read own practice attempts" on public.practice_quiz_attempts;
create policy "Students read own practice attempts" on public.practice_quiz_attempts for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.practice_quizzes from anon, authenticated;
grant select on public.practice_quizzes to authenticated;
revoke all on public.practice_quiz_generation_usage from anon, authenticated;
revoke all on public.practice_quiz_attempts from anon, authenticated;
grant select on public.practice_quiz_attempts to authenticated;

create or replace function public.get_practice_quiz_usage()
returns table(tier text, used bigint, weekly_limit integer, resets_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  with caller as (select auth.uid() as id),
  usage as (
    select count(*)::bigint as used,
           min(u.created_at + interval '7 days') as resets_at
    from public.practice_quiz_generation_usage u, caller c
    where u.user_id = c.id and u.created_at > now() - interval '7 days'
  )
  select case when (auth.jwt() -> 'app_metadata' ->> 'subscription_tier') = 'paid' then 'paid' else 'free' end,
         case when (auth.jwt() -> 'app_metadata' ->> 'subscription_tier') = 'paid' then 0::bigint else usage.used end,
         case when (auth.jwt() -> 'app_metadata' ->> 'subscription_tier') = 'paid' then null::integer else 3 end,
         usage.resets_at
  from usage
  where (select id from caller) is not null;
$$;

create or replace function public.create_practice_quiz(
  p_subject_id uuid,
  p_topic text,
  p_title text,
  p_difficulty text,
  p_questions jsonb
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  quiz_id uuid;
  is_paid boolean := (auth.jwt() -> 'app_metadata' ->> 'subscription_tier') = 'paid';
  current_use bigint;
  item jsonb;
begin
  if caller_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if char_length(trim(p_topic)) not between 2 and 120 or char_length(trim(p_title)) not between 1 and 160 then raise exception 'INVALID_QUIZ'; end if;
  if p_difficulty not in ('beginner', 'intermediate', 'advanced') then raise exception 'INVALID_QUIZ'; end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) not in (5, 10) then raise exception 'INVALID_QUIZ'; end if;
  for item in select value from jsonb_array_elements(p_questions) loop
    if jsonb_typeof(item) <> 'object'
      or jsonb_typeof(item -> 'prompt') <> 'string'
      or jsonb_typeof(item -> 'options') <> 'array'
      or jsonb_array_length(item -> 'options') <> 4
      or jsonb_typeof(item -> 'correctIndex') <> 'number'
      or (item ->> 'correctIndex')::integer not between 0 and 3
      or jsonb_typeof(item -> 'explanation') <> 'string' then
      raise exception 'INVALID_QUIZ';
    end if;
  end loop;
  if p_subject_id is not null and not exists (select 1 from public.subjects s where s.id = p_subject_id and s.user_id = caller_id) then
    raise exception 'INVALID_SUBJECT';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(caller_id::text, 0));
  select count(*) into current_use from public.practice_quiz_generation_usage u
    where u.user_id = caller_id and u.created_at > now() - interval '7 days';
  if not is_paid and current_use >= 3 then raise exception 'PRACTICE_WEEKLY_LIMIT'; end if;

  insert into public.practice_quizzes(user_id, subject_id, title, topic, difficulty, questions)
  values (caller_id, p_subject_id, trim(p_title), trim(p_topic), p_difficulty, p_questions)
  returning id into quiz_id;
  insert into public.practice_quiz_generation_usage(user_id, quiz_id) values (caller_id, quiz_id);
  return quiz_id;
end;
$$;

create or replace function public.record_practice_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns table(attempt_id uuid, score integer, total integer, feedback jsonb)
language plpgsql security definer set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  quiz record;
  answer_count integer;
  question_count integer;
  computed_score integer := 0;
  feedback_items jsonb := '[]'::jsonb;
  i integer;
  question jsonb;
  answer integer;
  correct integer;
  new_attempt_id uuid;
begin
  if caller_id is null then raise exception 'AUTH_REQUIRED'; end if;
  select q.questions into quiz from public.practice_quizzes q where q.id = p_quiz_id and q.user_id = caller_id;
  if not found then raise exception 'QUIZ_NOT_FOUND'; end if;
  if jsonb_typeof(p_answers) <> 'array' then raise exception 'INVALID_ANSWERS'; end if;
  question_count := jsonb_array_length(quiz.questions);
  answer_count := jsonb_array_length(p_answers);
  if answer_count <> question_count then raise exception 'INVALID_ANSWERS'; end if;

  for i in 0..question_count - 1 loop
    question := quiz.questions -> i;
    answer := (p_answers ->> i)::integer;
    correct := (question ->> 'correctIndex')::integer;
    if answer < -1 or answer > 3 then raise exception 'INVALID_ANSWERS'; end if;
    if answer = correct then computed_score := computed_score + 1; end if;
    feedback_items := feedback_items || jsonb_build_array(jsonb_build_object(
      'correctIndex', correct, 'isCorrect', answer = correct, 'explanation', question ->> 'explanation'
    ));
  end loop;

  insert into public.practice_quiz_attempts(quiz_id, user_id, answers, score, total)
  values (p_quiz_id, caller_id, p_answers, computed_score, question_count)
  returning id into new_attempt_id;
  return query select new_attempt_id, computed_score, question_count, feedback_items;
end;
$$;

revoke all on function public.get_practice_quiz_usage() from public, anon;
grant execute on function public.get_practice_quiz_usage() to authenticated;
revoke all on function public.create_practice_quiz(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.create_practice_quiz(uuid, text, text, text, jsonb) to authenticated;
revoke all on function public.record_practice_quiz_attempt(uuid, jsonb) from public, anon;
grant execute on function public.record_practice_quiz_attempt(uuid, jsonb) to authenticated;
