-- Shift + wake time for protocol session windows (wake-relative guardrails).

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS shift_schedule TEXT,
  ADD COLUMN IF NOT EXISTS wake_time TIME;

COMMENT ON COLUMN public.member_profiles.shift_schedule IS
  'Work pattern: days | swings | mids | nights | rotating (nullable).';
COMMENT ON COLUMN public.member_profiles.wake_time IS
  'Local wake time; protocol session windows are offsets from this (nullable = use wall-clock fallback).';

UPDATE public.member_profiles
SET shift_schedule = 'days'
WHERE shift_schedule IS NULL;

ALTER TABLE public.member_profiles
  ALTER COLUMN shift_schedule SET DEFAULT 'days';
