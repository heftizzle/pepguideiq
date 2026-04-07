-- Globally unique public handle per member profile (optional).

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS handle TEXT;

COMMENT ON COLUMN public.member_profiles.handle IS
  'Globally unique public @handle: lowercase a-z, digits, underscore; 3–20 chars; nullable.';

-- One non-null handle value across all rows (multiple NULLs allowed).
CREATE UNIQUE INDEX IF NOT EXISTS member_profiles_handle_unique
  ON public.member_profiles (handle)
  WHERE handle IS NOT NULL;

ALTER TABLE public.member_profiles DROP CONSTRAINT IF EXISTS member_profiles_handle_format_chk;

ALTER TABLE public.member_profiles
  ADD CONSTRAINT member_profiles_handle_format_chk
  CHECK (
    handle IS NULL
    OR (
      char_length(handle) >= 3
      AND char_length(handle) <= 20
      AND handle ~ '^[a-z0-9_]+$'
    )
  );
