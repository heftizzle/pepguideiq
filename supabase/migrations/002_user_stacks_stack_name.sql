-- Optional display name for the user's saved stack (one row per user).
ALTER TABLE public.user_stacks
  ADD COLUMN IF NOT EXISTS stack_name TEXT NOT NULL DEFAULT '';
