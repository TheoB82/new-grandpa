-- Grandpa Tassos Cooking — track each subscriber's site language at signup
-- Run this once in the Supabase Dashboard (Project → SQL Editor → New query → paste → Run).
-- Safe to re-run: idempotent. Existing subscribers default to 'gr' (the site's
-- default language, and the language the current subscriber base signed up under).

alter table public.subscribers
  add column if not exists lang text not null default 'gr';
