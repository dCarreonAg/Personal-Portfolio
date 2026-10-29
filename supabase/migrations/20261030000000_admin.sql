-- Run after 20261029000000_init.sql.

-- Supabase's default privileges give the anon role full table rights in
-- public; Row Level Security already blocks writes, this removes them as a
-- second layer. TRUNCATE also bypasses RLS, so it goes for both roles.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon;
revoke truncate, references, trigger
  on all tables in schema public from authenticated;
revoke select on public.plan_phases, public.plan_tasks from anon;

-- Lets the panel turn away any signed-in account that is not the owner.
create or replace function public.is_owner()
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.is_owner();
$$;

revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;
