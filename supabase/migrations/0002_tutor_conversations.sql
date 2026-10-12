-- StudyForge migration 0002 — AI tutor conversations
--
-- ADDITIVE ONLY. Creates two new tables plus their indexes and RLS policies.
-- Requires migration 0001 (it reuses public.studyforge_touch_updated_at).
-- It does not drop, rename, reset or rewrite anything that already exists.
--
-- Safe to run more than once. Review this file before running it.
-- Run it in the Supabase SQL editor after 0001.

begin;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per tutoring thread. A thread is private to the student who started it.
create table if not exists public.tutor_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title      text not null default 'New conversation'
             check (char_length(btrim(title)) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tutor_conversations is
  'AI Tutor threads. Private per student; RLS enforces auth.uid() = user_id.';

-- One row per message. user_id is denormalised deliberately so that a message
-- is protected by RLS on its own, without depending on a join to the parent.
create table if not exists public.tutor_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.tutor_conversations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null check (char_length(content) between 1 and 20000),
  model           text,
  created_at      timestamptz not null default now()
);

comment on table public.tutor_messages is
  'Individual tutor messages. role is limited to user/assistant so system prompts can never be persisted or replayed from the client.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Conversation list: "my threads, most recently active first".
create index if not exists tutor_conversations_user_updated_idx
  on public.tutor_conversations (user_id, updated_at desc);

-- Replaying a thread in order.
create index if not exists tutor_messages_conversation_created_idx
  on public.tutor_messages (conversation_id, created_at);

-- Deleting a student's whole history in one pass.
create index if not exists tutor_messages_user_idx
  on public.tutor_messages (user_id);

-- ---------------------------------------------------------------------------
-- Shared, atomic per-user tutor rate limit
-- ---------------------------------------------------------------------------

create table if not exists public.tutor_rate_limits (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null,
  request_count     integer not null default 0 check (request_count >= 0)
);

alter table public.tutor_rate_limits enable row level security;
revoke all on public.tutor_rate_limits from anon, authenticated;

create or replace function public.consume_tutor_request_limit()
returns table (allowed boolean, remaining integer, reset_in_ms bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_window timestamptz;
  current_count integer;
  v_now timestamptz := clock_timestamp();
  request_limit constant integer := 5;
  window_seconds constant integer := 60;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.tutor_rate_limits (user_id, window_started_at, request_count)
  values (caller_id, v_now, 0)
  on conflict (user_id) do nothing;

  select limits.window_started_at, limits.request_count
  into current_window, current_count
  from public.tutor_rate_limits as limits
  where limits.user_id = caller_id
  for update;

  if current_window + make_interval(secs => window_seconds) <= v_now then
    current_window := v_now;
    current_count := 0;
    update public.tutor_rate_limits as limits
    set window_started_at = current_window, request_count = current_count
    where limits.user_id = caller_id;
  end if;

  if current_count >= request_limit then
    return query select false, 0, greatest(
      floor(extract(epoch from (current_window + make_interval(secs => window_seconds) - v_now)) * 1000)::bigint,
      0
    );
    return;
  end if;

  current_count := current_count + 1;
  update public.tutor_rate_limits as limits
  set request_count = current_count
  where limits.user_id = caller_id;

  return query select true, request_limit - current_count, greatest(
    floor(extract(epoch from (current_window + make_interval(secs => window_seconds) - v_now)) * 1000)::bigint,
    0
  );
end;
$$;

revoke all on function public.consume_tutor_request_limit() from public, anon;
grant execute on function public.consume_tutor_request_limit() to authenticated;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

drop trigger if exists tutor_conversations_touch_updated_at on public.tutor_conversations;
create trigger tutor_conversations_touch_updated_at
  before update on public.tutor_conversations
  for each row
  execute function public.studyforge_touch_updated_at();

-- Keep thread ordering in sync whenever a new message is added.
create or replace function public.studyforge_touch_tutor_conversation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.tutor_conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists tutor_messages_touch_conversation on public.tutor_messages;
create trigger tutor_messages_touch_conversation
  after insert on public.tutor_messages
  for each row
  execute function public.studyforge_touch_tutor_conversation();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.tutor_conversations enable row level security;
alter table public.tutor_messages      enable row level security;

revoke all on public.tutor_conversations from anon;
revoke all on public.tutor_messages      from anon;
grant select, insert, update, delete on public.tutor_conversations to authenticated;
grant select, insert, update, delete on public.tutor_messages      to authenticated;

-- Conversations -----------------------------------------------------------------

drop policy if exists "tutor_conversations_select_own" on public.tutor_conversations;
create policy "tutor_conversations_select_own" on public.tutor_conversations
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "tutor_conversations_insert_own" on public.tutor_conversations;
create policy "tutor_conversations_insert_own" on public.tutor_conversations
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "tutor_conversations_update_own" on public.tutor_conversations;
create policy "tutor_conversations_update_own" on public.tutor_conversations
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tutor_conversations_delete_own" on public.tutor_conversations;
create policy "tutor_conversations_delete_own" on public.tutor_conversations
  for delete to authenticated
  using (auth.uid() = user_id);

-- Messages ----------------------------------------------------------------------
-- Insert and select additionally verify that the parent conversation belongs
-- to the caller, so a crafted conversation_id cannot be used to write into
-- someone else's thread.

drop policy if exists "tutor_messages_select_own" on public.tutor_messages;
create policy "tutor_messages_select_own" on public.tutor_messages
  for select to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.tutor_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "tutor_messages_insert_own" on public.tutor_messages;
create policy "tutor_messages_insert_own" on public.tutor_messages
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.tutor_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "tutor_messages_delete_own" on public.tutor_messages;
create policy "tutor_messages_delete_own" on public.tutor_messages
  for delete to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.tutor_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- No update policy on tutor_messages by design: a saved message is immutable.
-- Regenerating an answer appends a new message instead of rewriting history.

commit;
