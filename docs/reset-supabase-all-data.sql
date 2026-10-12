-- DESTRUCTIVE: use only when you intentionally want a completely fresh
-- StudyForge project. This removes every Supabase Auth account and every
-- database row whose foreign key points to auth.users (including StudyForge
-- subjects, notes, tutor history, quizzes, flashcards, and profiles).
--
-- Export/backup the project first. This cannot be undone.
-- Run manually in the Supabase SQL Editor; this file is not a migration.
--
-- Supabase Storage file contents are not reliably removed by SQL truncation.
-- Clear the StudyForge buckets through Storage (or the Storage API) separately.

begin;

truncate table auth.users cascade;

commit;
