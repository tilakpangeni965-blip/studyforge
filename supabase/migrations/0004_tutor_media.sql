-- StudyForge migration 0004 — private AI Tutor image attachments
--
-- ADDITIVE ONLY. Stores attachment metadata on tutor messages and creates a
-- private Supabase Storage bucket scoped to each signed-in student's folders.
-- Run this migration in the Supabase SQL editor after migrations 0001–0003.

begin;

alter table public.tutor_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb;

comment on column public.tutor_messages.attachments is
  'Private Storage object metadata for image inputs sent to the AI Tutor.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tutor-attachments',
  'tutor-attachments',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 8388608,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tutor_attachments_select_own" on storage.objects;
create policy "tutor_attachments_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'tutor-attachments'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "tutor_attachments_insert_own" on storage.objects;
create policy "tutor_attachments_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'tutor-attachments'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "tutor_attachments_delete_own" on storage.objects;
create policy "tutor_attachments_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'tutor-attachments'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

commit;
