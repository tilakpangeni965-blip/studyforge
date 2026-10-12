-- Private files attached to a student's subjects.
create table if not exists public.subject_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  path text not null unique,
  name text not null check (char_length(name) between 1 and 200),
  mime_type text not null,
  size bigint not null check (size between 1 and 20971520),
  created_at timestamptz not null default now(),
  constraint subject_files_owner_path_check check (path like (user_id::text || '/' || subject_id::text || '/%'))
);

create index if not exists subject_files_subject_created_idx on public.subject_files(subject_id, created_at desc);
alter table public.subject_files enable row level security;
revoke all on public.subject_files from anon, authenticated;
grant select, insert, delete on public.subject_files to authenticated;

drop policy if exists "Students read own subject files" on public.subject_files;
create policy "Students read own subject files" on public.subject_files
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Students add own subject files" on public.subject_files;
create policy "Students add own subject files" on public.subject_files
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid()))
  );
drop policy if exists "Students delete own subject files" on public.subject_files;
create policy "Students delete own subject files" on public.subject_files
  for delete to authenticated using (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'subject-files',
  'subject-files',
  false,
  20971520,
  array[
    'application/pdf', 'text/plain', 'text/markdown', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg', 'image/png', 'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Students read own subject storage" on storage.objects;
create policy "Students read own subject storage" on storage.objects
  for select to authenticated using (
    bucket_id = 'subject-files' and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
drop policy if exists "Students upload own subject storage" on storage.objects;
create policy "Students upload own subject storage" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'subject-files' and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
drop policy if exists "Students delete own subject storage" on storage.objects;
create policy "Students delete own subject storage" on storage.objects
  for delete to authenticated using (
    bucket_id = 'subject-files' and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
