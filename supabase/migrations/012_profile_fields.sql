-- Profile tab: display name, avatar R2 key, body metrics, default protocol session.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_r2_key TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weight_lbs NUMERIC;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS height_in NUMERIC;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS body_fat_pct NUMERIC;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_session TEXT DEFAULT 'morning';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'lbs';

COMMENT ON COLUMN public.profiles.display_name IS 'User-editable display name (separate from legacy name).';
COMMENT ON COLUMN public.profiles.avatar_r2_key IS 'Private R2 object key for profile photo, typically {user_id}/avatar.jpg.';
COMMENT ON COLUMN public.profiles.height_in IS 'Height stored in total inches for unit switching in UI.';

-- Aggregated stats for Profile tab (RLS-safe via auth.uid()).
CREATE OR REPLACE FUNCTION public.get_user_profile_stats()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'dose_count', COALESCE((SELECT COUNT(*)::int FROM public.dose_logs WHERE user_id = auth.uid()), 0),
    'peptide_distinct', COALESCE((SELECT COUNT(DISTINCT peptide_id)::int FROM public.dose_logs WHERE user_id = auth.uid()), 0),
    'active_vials', COALESCE((SELECT COUNT(*)::int FROM public.user_vials WHERE user_id = auth.uid() AND status = 'active'), 0),
    'days_tracked', COALESCE(
      (SELECT COUNT(DISTINCT ((dosed_at AT TIME ZONE 'UTC')::date))::int FROM public.dose_logs WHERE user_id = auth.uid()),
      0
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_user_profile_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_profile_stats() TO authenticated;
