-- StudyForge migration 0001 — notes
--
-- ADDITIVE ONLY. Creates one new table plus its indexes, trigger and RLS
-- policies. It does not drop, rename, reset or rewrite anything that already
-- exists, and it does not touch auth.users, public.subjects or public.profiles.
--
-- Safe to run more than once: every statement is create-or-replace / if-not-exists.
-- Review this file before running it. Run it in the Supabase SQL editor.

begin;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title      text not null check (char_length(btrim(title)) between 1 and 200),
  content    text not null default '' check (char_length(content) <= 50000),
  tags       text[] not null default '{}'::text[],
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table  public.notes           is 'Per-user study notes. Ownership is enforced by RLS: auth.uid() = user_id.';
comment on column public.notes.subject_id is 'Optional link to public.subjects. Nulled out if the subject is deleted, so notes are never lost.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- The notes list is always "my notes, newest first".
create index if not exists notes_user_updated_idx
  on public.notes (user_id, updated_at desc);

-- Filtering the list by subject.
create index if not exists notes_subject_idx
  on public.notes (subject_id)
  where subject_id is not null;

-- Case-insensitive full-text search across title and body.
create index if not exists notes_search_idx
  on public.notes
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

-- One shared trigger function, reused by every table this project adds.
create or replace function public.studyforge_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists notes_touch_updated_at on public.notes;
create trigger notes_touch_updated_at
  before update on public.notes
  for each row
  execute function public.studyforge_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.notes enable row level security;

-- Explicit grants; RLS below is the real gate. Signed-out users get nothing.
revoke all on public.notes from anon;
grant select, insert, update, delete on public.notes to authenticated;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own" on public.notes
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own" on public.notes
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own" on public.notes
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own" on public.notes
  for delete to authenticated
  using (auth.uid() = user_id);

commit;
