-- Add the student's subjects and notes tables to Supabase Realtime when those
-- tables are not already published. Run after migrations 0001 and review this
-- migration manually in the Supabase SQL editor.

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['subjects', 'notes'] loop
      if to_regclass('public.' || table_name) is not null
        and not exists (
          select 1
          from pg_publication_tables
          where pubname = 'supabase_realtime'
            and schemaname = 'public'
            and tablename = table_name
        ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;
