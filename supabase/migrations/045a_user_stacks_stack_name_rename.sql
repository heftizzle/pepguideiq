-- Renamed from 002_user_stacks_stack_name.sql to avoid duplicate "002_*" ordering alongside 002_profiles_stripe_pending.sql.
-- Apply after 045_member_follows_select_rls.sql (lexicographic: 045a runs after 045).

-- Optional display name for the user's saved stack (one row per user).
ALTER TABLE public.user_stacks
  ADD COLUMN IF NOT EXISTS stack_name TEXT NOT NULL DEFAULT '';
