-- Grandpa Tassos Cooking — recipes table migration
-- Run this once in the Supabase Dashboard (Project → SQL Editor → New query → paste → Run).
-- Safe to re-run: every statement is idempotent.

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  short_id text not null unique,

  category_en text not null,
  category_gr text not null,

  title_en text not null,
  title_gr text not null,

  short_description_en text not null,
  short_description_gr text not null,

  long_description_en text,
  long_description_gr text,

  ingredients_en text not null,
  ingredients_gr text not null,

  execution_en text,
  execution_gr text,

  tags_en text[] not null default '{}',
  tags_gr text[] not null default '{}',

  link_yt text,
  photo_url text,

  recipe_date date,

  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer,
  difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')),
  calories_per_serving integer,
  calories_estimated boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_short_id_idx on public.recipes (short_id);
create index if not exists recipes_category_en_idx on public.recipes (category_en);
create index if not exists recipes_category_gr_idx on public.recipes (category_gr);

-- Auto-bump updated_at on every row change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
  before update on public.recipes
  for each row
  execute function public.set_updated_at();

-- RLS: public can read every recipe, but cannot insert/update/delete.
-- All writes go through a server-side route using the service/secret key,
-- which bypasses RLS entirely — same trust boundary as the ADMIN_PASSWORD
-- gate already used for the GitHub-based admin flow.
alter table public.recipes enable row level security;

drop policy if exists "Public read access to recipes" on public.recipes;
create policy "Public read access to recipes"
  on public.recipes
  for select
  to public
  using (true);
