-- Private decks and cards for each student.
create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  front text not null check (char_length(front) between 1 and 10000),
  back text not null check (char_length(back) between 1 and 10000),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create index if not exists flashcard_decks_user_updated_idx on public.flashcard_decks(user_id, updated_at desc);
create index if not exists flashcards_deck_position_idx on public.flashcards(deck_id, position, created_at);
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;

revoke all on public.flashcard_decks from anon, authenticated;
grant select, insert, update, delete on public.flashcard_decks to authenticated;
revoke all on public.flashcards from anon, authenticated;
grant select, insert, update, delete on public.flashcards to authenticated;

drop policy if exists "Students manage own flashcard decks" on public.flashcard_decks;
create policy "Students manage own flashcard decks" on public.flashcard_decks
  for all to authenticated using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (subject_id is null or exists (
      select 1 from public.subjects s where s.id = subject_id and s.user_id = (select auth.uid())
    ))
  );

drop policy if exists "Students manage own flashcards" on public.flashcards;
create policy "Students manage own flashcards" on public.flashcards
  for all to authenticated using (
    user_id = (select auth.uid())
    and exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.user_id = (select auth.uid()))
  ) with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.flashcard_decks d where d.id = deck_id and d.user_id = (select auth.uid()))
  );
