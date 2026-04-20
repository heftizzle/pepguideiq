-- Canonical member avatar storage: R2 object key on member_profiles (not a stable public URL).
-- IANA timezone for tz-aware active streak (browser sends primary value; Worker may refine).

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS avatar_r2_key text;

UPDATE public.member_profiles mp
SET avatar_r2_key = regexp_replace(mp.avatar_url, '^https?://[^/]+/avatars/', '')
WHERE mp.avatar_url IS NOT NULL
  AND mp.avatar_url ~ '^https?://[^/]+/avatars/'
  AND (mp.avatar_r2_key IS NULL OR btrim(mp.avatar_r2_key) = '');

UPDATE public.member_profiles mp
SET avatar_r2_key = btrim(mp.avatar_url)
WHERE mp.avatar_url IS NOT NULL
  AND mp.avatar_url NOT LIKE 'http%'
  AND mp.avatar_url NOT LIKE '%..%'
  AND position('/' in mp.avatar_url) > 0
  AND (mp.avatar_r2_key IS NULL OR btrim(mp.avatar_r2_key) = '');

ALTER TABLE public.member_profiles
  DROP CONSTRAINT IF EXISTS member_profiles_avatar_url_worker_path_chk;

ALTER TABLE public.member_profiles
  DROP COLUMN IF EXISTS avatar_url;

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC';

-- CHECK (subquery to pg_timezone_names) is invalid in PostgreSQL; enforce via trigger.
CREATE OR REPLACE FUNCTION public.member_profiles_enforce_timezone_iana()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.timezone IS NULL OR btrim(NEW.timezone) = '' THEN
    NEW.timezone := 'UTC';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names z WHERE z.name = NEW.timezone) THEN
    RAISE EXCEPTION 'invalid IANA timezone: %', NEW.timezone
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS member_profiles_timezone_iana_trg ON public.member_profiles;
CREATE TRIGGER member_profiles_timezone_iana_trg
  BEFORE INSERT OR UPDATE ON public.member_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.member_profiles_enforce_timezone_iana();

COMMENT ON COLUMN public.member_profiles.avatar_r2_key IS
  'Public R2 object key for member avatar; Worker GET /avatars/{key}. Content-hashed filename.';

COMMENT ON COLUMN public.member_profiles.timezone IS
  'IANA zone name (e.g. America/New_York); used for active-streak local calendar days.';
