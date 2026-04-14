-- Goals on member_profiles (comma-separated ids, same vocabulary as body_metrics.goal / ProfileTab GOAL_OPTIONS).

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS goals TEXT;

COMMENT ON COLUMN public.member_profiles.goals IS
  'Comma-separated goal ids (e.g. shred,bulk); mirrors body_metrics.goal for profile-scoped UX.';

UPDATE public.member_profiles mp
SET goals = bm.goal
FROM public.body_metrics bm
WHERE bm.profile_id = mp.id
  AND bm.goal IS NOT NULL
  AND btrim(bm.goal) <> ''
  AND (mp.goals IS NULL OR btrim(mp.goals) = '');
