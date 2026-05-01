-- Stricter public handles: letter-first, 3–30 chars, [a-z0-9_-] only (no periods).
-- Reserved slugs blocked. Abort with offender list if any row violates the new rules.

DO $$
DECLARE
  offenders text := '';
  r         record;
BEGIN
  FOR r IN
    SELECT id, handle
    FROM public.member_profiles
    WHERE handle IS NOT NULL
      AND (
        handle !~ '^[a-z][a-z0-9_-]{2,29}$'
        OR lower(handle) IN (
          'admin',
          'support',
          'pepguide',
          'pepguideiq',
          'api',
          'help',
          'null',
          'undefined',
          'me',
          'settings',
          'notifications',
          'explore',
          'search'
        )
      )
  LOOP
    offenders := offenders || format(E'\n  id=%s handle=%s', r.id::text, r.handle);
  END LOOP;

  IF offenders <> '' THEN
    RAISE EXCEPTION
      '091_member_profiles_handle_strict_format: migration blocked — fix these handles first:%',
      offenders;
  END IF;
END $$;

ALTER TABLE public.member_profiles DROP CONSTRAINT IF EXISTS member_profiles_handle_format_chk;

ALTER TABLE public.member_profiles
  ADD CONSTRAINT member_profiles_handle_format_chk
  CHECK (
    handle IS NULL
    OR (
      handle ~ '^[a-z][a-z0-9_-]{2,29}$'
      AND lower(handle) NOT IN (
        'admin',
        'support',
        'pepguide',
        'pepguideiq',
        'api',
        'help',
        'null',
        'undefined',
        'me',
        'settings',
        'notifications',
        'explore',
        'search'
      )
    )
  );

ALTER TABLE public.member_profiles DROP CONSTRAINT IF EXISTS member_profiles_display_handle_sync_chk;

ALTER TABLE public.member_profiles
  ADD CONSTRAINT member_profiles_display_handle_sync_chk
  CHECK (
    (handle IS NULL AND display_handle IS NULL)
    OR (
      handle IS NOT NULL
      AND display_handle IS NOT NULL
      AND char_length(btrim(display_handle)) BETWEEN 3 AND 30
      AND lower(btrim(display_handle)) = handle
    )
  );

COMMENT ON COLUMN public.member_profiles.handle IS
  'Globally unique public @handle (lowercase): starts with a letter; letters, digits, underscore, hyphen; 3–30 chars; nullable.';
