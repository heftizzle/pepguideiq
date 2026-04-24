-- Per-profile flag: user finished the forced core tutorial walkthrough.
ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS tutorial_completed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.member_profiles.tutorial_completed IS
  'True after the member finishes the 7-step core tutorial. Existing non-empty handles are backfilled so legacy users are not forced through it again.';

-- Backfill: profiles that already chose a public handle are treated as past core onboarding.
UPDATE public.member_profiles mp
SET tutorial_completed = true
WHERE mp.handle IS NOT NULL
  AND btrim(mp.handle) <> '';
