-- Keep public.profiles.display_name aligned with the account's *default* member profile only.
-- Inserts (and updates) for non-default member_profiles must not overwrite the parent profiles row.
--
-- If a stray trigger in a database still syncs display_name unconditionally, list triggers with:
--   SELECT tgname FROM pg_trigger t
--   JOIN pg_class c ON c.oid = t.tgrelid
--   WHERE c.relname = 'member_profiles' AND NOT t.tgisinternal
--   ORDER BY 1;

DROP TRIGGER IF EXISTS member_profiles_sync_profiles_display ON public.member_profiles;
DROP TRIGGER IF EXISTS trg_member_profiles_sync_profiles ON public.member_profiles;
DROP TRIGGER IF EXISTS sync_member_profile_display_to_profiles ON public.member_profiles;

DROP FUNCTION IF EXISTS public.member_profiles_sync_profiles_display_name();

CREATE OR REPLACE FUNCTION public.member_profiles_sync_account_display_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles p
  SET
    display_name = NEW.display_name,
    updated_at = NOW()
  WHERE p.id = NEW.user_id
    AND p.display_name IS DISTINCT FROM NEW.display_name;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.member_profiles_sync_account_display_name() FROM PUBLIC;

DROP TRIGGER IF EXISTS member_profiles_sync_account_display_name ON public.member_profiles;
CREATE TRIGGER member_profiles_sync_account_display_name
  AFTER INSERT OR UPDATE OF display_name, is_default
  ON public.member_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.member_profiles_sync_account_display_name();

COMMENT ON FUNCTION public.member_profiles_sync_account_display_name IS
  'Sets profiles.display_name from member_profiles when is_default is true; skips non-default rows.';
