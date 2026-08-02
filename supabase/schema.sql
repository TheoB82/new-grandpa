-- Grandpa Tassos Cooking — Supabase setup
-- Run this once in the Supabase Dashboard (Project → SQL Editor → New query → paste → Run).
-- Safe to re-run: every statement is idempotent.

-- ---------------------------------------------------------------
-- Email subscribers (newsletter signup)
-- ---------------------------------------------------------------
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,               -- where they signed up (e.g. "footer", "recipe-page")
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

-- Public visitors can add themselves, but cannot read, update, or delete
-- any row — the subscriber list itself is only visible from the Supabase
-- dashboard (or a future server-side admin route using the secret key).
drop policy if exists "Allow public insert" on public.subscribers;
create policy "Allow public insert"
  on public.subscribers
  for insert
  to anon
  with check (true);

-- ---------------------------------------------------------------
-- Recipe photo storage (for the future admin rebuild)
-- ---------------------------------------------------------------
-- Public bucket: anyone can view photos (needed to display them on the site),
-- but nobody can upload directly from the browser. Uploads will go through a
-- server-side admin route using the secret key once that's built, not
-- through this public/anon key.
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read access to recipe photos" on storage.objects;
create policy "Public read access to recipe photos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'recipe-photos');
