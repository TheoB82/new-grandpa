-- Grandpa Tassos Cooking — add gallery photos support
-- Run this once in the Supabase Dashboard (Project → SQL Editor → New query → paste → Run).
-- Safe to re-run: idempotent.

alter table public.recipes
  add column if not exists gallery_photo_urls text[] not null default '{}';
