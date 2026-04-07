-- Demo tour: count successful logins per member profile (incremented client-side on sign-in).

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS demo_sessions_shown integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.member_profiles.demo_sessions_shown IS 'Incremented on each successful sign-in; drives first-login demo bar visibility (1–5 expand, 6–10 collapsed, 11+ help-only).';

CREATE OR REPLACE FUNCTION public.increment_member_profile_demo_sessions(p_profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  UPDATE public.member_profiles
  SET demo_sessions_shown = COALESCE(demo_sessions_shown, 0) + 1
  WHERE id = p_profile_id AND user_id = auth.uid()
  RETURNING demo_sessions_shown INTO n;
  RETURN COALESCE(n, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_member_profile_demo_sessions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_member_profile_demo_sessions(uuid) TO authenticated;
