-- Remove the paid/free quiz quota. All signed-in students may create quizzes.
-- The usage table only held quota counters, so it is no longer needed.

begin;

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
  item jsonb;
begin
  if caller_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_topic is null or char_length(trim(p_topic)) not between 2 and 120
    or p_title is null or char_length(trim(p_title)) not between 1 and 160 then
    raise exception 'INVALID_QUIZ';
  end if;
  if p_difficulty not in ('beginner', 'intermediate', 'advanced') then raise exception 'INVALID_QUIZ'; end if;
  if p_questions is null or jsonb_typeof(p_questions) <> 'array'
    or jsonb_array_length(p_questions) not in (5, 10) then raise exception 'INVALID_QUIZ'; end if;
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
  if p_subject_id is not null and not exists (
    select 1 from public.subjects s where s.id = p_subject_id and s.user_id = caller_id
  ) then raise exception 'INVALID_SUBJECT'; end if;

  insert into public.practice_quizzes(user_id, subject_id, title, topic, difficulty, questions)
  values (caller_id, p_subject_id, trim(p_title), trim(p_topic), p_difficulty, p_questions)
  returning id into quiz_id;
  return quiz_id;
end;
$$;

drop function if exists public.get_practice_quiz_usage();
drop table if exists public.practice_quiz_generation_usage;

commit;
