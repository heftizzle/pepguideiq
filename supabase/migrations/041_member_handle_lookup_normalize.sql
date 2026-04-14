-- Canonical handles must be lowercase (see member_profiles_display_handle_sync_chk).
-- Backfill any legacy mixed-case rows, then expose a case-insensitive lookup for the API worker.

UPDATE public.member_profiles
SET handle = lower(handle)
WHERE handle IS NOT NULL
  AND handle <> lower(handle);

CREATE OR REPLACE FUNCTION public.member_profile_public_by_handle_lookup(handle_query text)
RETURNS SETOF public.member_profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mp.*
  FROM public.member_profiles mp
  WHERE mp.handle IS NOT NULL
    AND lower(btrim(mp.handle)) = lower(
      btrim(regexp_replace(trim(COALESCE(handle_query, '')), '^@+', '', 'g'))
    )
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.member_profile_public_by_handle_lookup(text) IS
  'Returns at most one member_profiles row by canonical handle; strips leading @, trims, compares case-insensitively. Worker-only (service_role).';

REVOKE ALL ON FUNCTION public.member_profile_public_by_handle_lookup(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.member_profile_public_by_handle_lookup(text) TO service_role;
