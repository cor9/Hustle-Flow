-- Hustle Flow Supabase schema (tables + storage bucket)
-- Run in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.boards (
  id text primary key,
  workspace_id text not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key,
  workspace_id text not null,
  title text not null,
  assignee text not null default '',
  type text not null,
  status text not null,
  priority text not null,
  board text not null,
  start_date date,
  due_date date,
  estimate_hours numeric not null default 0,
  cost_rate numeric not null default 0,
  details text not null default '',
  milestone boolean not null default false,
  custom_attrs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key,
  workspace_id text not null,
  name text not null,
  url text not null,
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.wiki_pages (
  id uuid primary key,
  workspace_id text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key,
  workspace_id text not null,
  name text not null,
  skills jsonb not null default '[]'::jsonb,
  status text not null,
  load numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key,
  workspace_id text not null,
  name text not null,
  budget numeric not null default 0,
  health text not null default 'Green',
  created_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key,
  workspace_id text not null,
  task_id uuid,
  date date not null,
  hours numeric not null default 0,
  rate numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.openclaw_settings (
  id text primary key,
  workspace_id text not null unique,
  url text not null default '',
  token text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_workspace on public.tasks(workspace_id);
create index if not exists idx_documents_workspace on public.documents(workspace_id);
create index if not exists idx_wiki_workspace on public.wiki_pages(workspace_id);
create index if not exists idx_agents_workspace on public.agents(workspace_id);
create index if not exists idx_projects_workspace on public.projects(workspace_id);
create index if not exists idx_time_workspace on public.time_entries(workspace_id);

alter table public.boards enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.wiki_pages enable row level security;
alter table public.agents enable row level security;
alter table public.projects enable row level security;
alter table public.time_entries enable row level security;
alter table public.openclaw_settings enable row level security;

drop policy if exists "public read boards" on public.boards;
create policy "public read boards" on public.boards for select using (true);
drop policy if exists "public write boards" on public.boards;
create policy "public write boards" on public.boards for all using (true) with check (true);

drop policy if exists "public read tasks" on public.tasks;
create policy "public read tasks" on public.tasks for select using (true);
drop policy if exists "public write tasks" on public.tasks;
create policy "public write tasks" on public.tasks for all using (true) with check (true);

drop policy if exists "public read documents" on public.documents;
create policy "public read documents" on public.documents for select using (true);
drop policy if exists "public write documents" on public.documents;
create policy "public write documents" on public.documents for all using (true) with check (true);

drop policy if exists "public read wiki_pages" on public.wiki_pages;
create policy "public read wiki_pages" on public.wiki_pages for select using (true);
drop policy if exists "public write wiki_pages" on public.wiki_pages;
create policy "public write wiki_pages" on public.wiki_pages for all using (true) with check (true);

drop policy if exists "public read agents" on public.agents;
create policy "public read agents" on public.agents for select using (true);
drop policy if exists "public write agents" on public.agents;
create policy "public write agents" on public.agents for all using (true) with check (true);

drop policy if exists "public read projects" on public.projects;
create policy "public read projects" on public.projects for select using (true);
drop policy if exists "public write projects" on public.projects;
create policy "public write projects" on public.projects for all using (true) with check (true);

drop policy if exists "public read time_entries" on public.time_entries;
create policy "public read time_entries" on public.time_entries for select using (true);
drop policy if exists "public write time_entries" on public.time_entries;
create policy "public write time_entries" on public.time_entries for all using (true) with check (true);

drop policy if exists "public read openclaw_settings" on public.openclaw_settings;
create policy "public read openclaw_settings" on public.openclaw_settings for select using (true);
drop policy if exists "public write openclaw_settings" on public.openclaw_settings;
create policy "public write openclaw_settings" on public.openclaw_settings for all using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  true,
  52428800,
  array['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'application/json']
)
on conflict (id) do nothing;

drop policy if exists "public read documents bucket" on storage.objects;
create policy "public read documents bucket"
on storage.objects for select
using (bucket_id = 'documents');

drop policy if exists "public write documents bucket" on storage.objects;
create policy "public write documents bucket"
on storage.objects for insert
with check (bucket_id = 'documents');

drop policy if exists "public update documents bucket" on storage.objects;
create policy "public update documents bucket"
on storage.objects for update
using (bucket_id = 'documents')
with check (bucket_id = 'documents');

drop policy if exists "public delete documents bucket" on storage.objects;
create policy "public delete documents bucket"
on storage.objects for delete
using (bucket_id = 'documents');
