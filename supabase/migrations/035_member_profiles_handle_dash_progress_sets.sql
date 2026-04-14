-- Handles: allow hyphen; max length 32. Progress: store archived completed trios in JSONB.

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS progress_photo_sets jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.member_profiles.progress_photo_sets IS
  'Completed front/side/back progress photo trios (newest first). Active uploads use progress_photo_* slot columns until archived.';

ALTER TABLE public.member_profiles DROP CONSTRAINT IF EXISTS member_profiles_handle_format_chk;

ALTER TABLE public.member_profiles
  ADD CONSTRAINT member_profiles_handle_format_chk
  CHECK (
    handle IS NULL
    OR (
      char_length(handle) BETWEEN 3 AND 32
      AND handle ~ '^[a-z0-9][a-z0-9_.-]*[a-z0-9]$'
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
      AND char_length(btrim(display_handle)) BETWEEN 3 AND 32
      AND lower(btrim(display_handle)) = handle
    )
  );

COMMENT ON COLUMN public.member_profiles.handle IS
  'Globally unique public @handle (lowercase): letters, digits, underscore, period, hyphen; 3–32 chars; nullable.';
