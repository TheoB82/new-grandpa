-- Grandpa Tassos Cooking — seasonality for the weekly meal planner
-- Run this once in the Supabase Dashboard (Project → SQL Editor → New query → paste → Run).
-- Safe to re-run: idempotent.

-- Empty array = season-agnostic (always eligible) — the classifier leaves this
-- empty rather than guess when a recipe isn't strongly tied to a season.
alter table public.recipes
  add column if not exists seasons text[] not null default '{}';
