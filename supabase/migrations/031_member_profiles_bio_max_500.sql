-- Bio lives on member_profiles (TEXT since 028); enforce max 500 chars at DB layer.

ALTER TABLE public.member_profiles DROP CONSTRAINT IF EXISTS member_profiles_bio_length_chk;

ALTER TABLE public.member_profiles
  ADD CONSTRAINT member_profiles_bio_length_chk
  CHECK (bio IS NULL OR char_length(bio) <= 500);

COMMENT ON COLUMN public.member_profiles.bio IS 'Short public bio; max 500 characters (enforced in app and Worker).';
