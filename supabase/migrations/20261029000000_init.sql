-- Portfolio schema, Row Level Security and image storage.
-- Run once in the Supabase SQL editor (or with `supabase db push`).

-- ---------------------------------------------------------------------------
-- Owner: the single account allowed to write. Lives in a schema the API does
-- not expose, so nobody can read or change it through Supabase's REST API.
-- ---------------------------------------------------------------------------
create schema if not exists private;

create table private.owner (
  user_id uuid primary key references auth.users (id) on delete cascade
);
revoke all on private.owner from public, anon, authenticated;

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.owner where user_id = (select auth.uid()));
$$;

revoke all on function private.is_owner() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_owner() to anon, authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create type public.path_kind as enum ('education', 'work', 'award', 'language');

-- Single row: the boolean primary key can only ever be true.
create table public.profile (
  id boolean primary key default true check (id),
  name text not null,
  headline text not null default '',
  bio text not null default '',
  availability text not null default '',
  focus text not null default '',
  -- Up to three {"title": "...", "detail": "..."} items for "Right now".
  right_now jsonb not null default '[]'::jsonb
    check (jsonb_typeof(right_now) = 'array' and jsonb_array_length(right_now) <= 3),
  email text not null default '',
  github text not null default '',
  linkedin text not null default '',
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text not null default '',
  role text not null default '',
  year text not null default '',
  tools text[] not null default '{}',
  -- Only http(s) URLs, so a link can never become javascript: or data:.
  demo_url text check (demo_url ~* '^https?://'),
  repo_url text check (repo_url ~* '^https?://'),
  image_url text check (image_url ~* '^https://'),
  case_study_md text not null default '',
  tagline text,
  award text,
  featured boolean not null default false,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one featured project.
create unique index projects_one_featured on public.projects ((true)) where featured;
create index projects_sort on public.projects (sort_order);

create table public.path_entries (
  id uuid primary key default gen_random_uuid(),
  kind public.path_kind not null,
  title text not null check (length(trim(title)) > 0),
  place text not null default '',
  years text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index path_entries_sort on public.path_entries (sort_order);

create table public.plan_phases (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  open boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.plan_tasks (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.plan_phases (id) on delete cascade,
  text text not null check (length(trim(text)) > 0),
  done boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index plan_tasks_phase on public.plan_tasks (phase_id, sort_order);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create trigger profile_touch before update on public.profile
  for each row execute function private.touch_updated_at();
create trigger projects_touch before update on public.projects
  for each row execute function private.touch_updated_at();
create trigger path_entries_touch before update on public.path_entries
  for each row execute function private.touch_updated_at();
create trigger plan_phases_touch before update on public.plan_phases
  for each row execute function private.touch_updated_at();
create trigger plan_tasks_touch before update on public.plan_tasks
  for each row execute function private.touch_updated_at();

-- Marking a project as featured un-features the others in the same statement,
-- so the panel never trips over the one-featured index.
create or replace function private.single_featured()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.featured then
    update public.projects set featured = false where featured and id <> new.id;
  end if;
  return new;
end;
$$;

create trigger projects_single_featured
  before insert or update of featured on public.projects
  for each row when (new.featured) execute function private.single_featured();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Public: read profile, path entries and published projects.
-- Owner: read and write everything. Plan tables are owner-only.
-- ---------------------------------------------------------------------------
alter table public.profile enable row level security;
alter table public.projects enable row level security;
alter table public.path_entries enable row level security;
alter table public.plan_phases enable row level security;
alter table public.plan_tasks enable row level security;

grant select on public.profile, public.projects, public.path_entries to anon;
grant select, insert, update, delete on
  public.profile, public.projects, public.path_entries, public.plan_phases, public.plan_tasks
  to authenticated;

create policy "Anyone can read the profile" on public.profile
  for select to anon, authenticated using (true);
create policy "Owner can insert the profile" on public.profile
  for insert to authenticated with check ((select private.is_owner()));
create policy "Owner can update the profile" on public.profile
  for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));

create policy "Anyone can read published projects" on public.projects
  for select to anon, authenticated using (published or (select private.is_owner()));
create policy "Owner can insert projects" on public.projects
  for insert to authenticated with check ((select private.is_owner()));
create policy "Owner can update projects" on public.projects
  for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "Owner can delete projects" on public.projects
  for delete to authenticated using ((select private.is_owner()));

create policy "Anyone can read path entries" on public.path_entries
  for select to anon, authenticated using (true);
create policy "Owner can insert path entries" on public.path_entries
  for insert to authenticated with check ((select private.is_owner()));
create policy "Owner can update path entries" on public.path_entries
  for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "Owner can delete path entries" on public.path_entries
  for delete to authenticated using ((select private.is_owner()));

create policy "Owner manages plan phases" on public.plan_phases
  for all to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy "Owner manages plan tasks" on public.plan_tasks
  for all to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));

-- ---------------------------------------------------------------------------
-- Storage: public-read bucket for project images, owner-only writes.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "Owner can upload project images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-images' and (select private.is_owner()));
create policy "Owner can update project images" on storage.objects
  for update to authenticated
  using (bucket_id = 'project-images' and (select private.is_owner()))
  with check (bucket_id = 'project-images' and (select private.is_owner()));
create policy "Owner can delete project images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-images' and (select private.is_owner()));
