-- Ensure multi-profile stacks can exist: one row per (user_id, profile_id).
-- If 013 did not fully apply, the legacy UNIQUE (user_id) alone blocks Worker POST /member-profiles.

ALTER TABLE public.user_stacks DROP CONSTRAINT IF EXISTS user_stacks_user_id_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'user_stacks'
      AND c.conname = 'user_stacks_user_profile_unique'
  ) THEN
    ALTER TABLE public.user_stacks
      ADD CONSTRAINT user_stacks_user_profile_unique UNIQUE (user_id, profile_id);
  END IF;
END $$;
