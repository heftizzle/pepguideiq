-- Tier label on profiles (default entry). Wire-up in app is separate from this DDL.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'entry';
