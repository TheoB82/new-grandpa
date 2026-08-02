-- Grandpa Tassos Cooking — new-recipe email notifications
-- Run this once in the Supabase Dashboard (Project → SQL Editor → New query → paste → Run).
-- Safe to re-run: idempotent.

-- Tracks whether the "new recipe live" email has been sent for a recipe, so the
-- daily cron never double-sends. Set the moment the email successfully goes out.
alter table public.recipes
  add column if not exists notified_at timestamptz;

-- Soft-delete for unsubscribes — keeps the row (so we never re-add them from a
-- future signup with the same source) but excludes them from every send.
alter table public.subscribers
  add column if not exists unsubscribed_at timestamptz;
