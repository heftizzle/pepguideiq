-- Locale fields on member_profiles (data capture; app i18n is separate).

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

COMMENT ON COLUMN public.member_profiles.city IS 'Free-text city.';
COMMENT ON COLUMN public.member_profiles.state IS 'Free-text region/state.';
COMMENT ON COLUMN public.member_profiles.country IS 'ISO 3166-1 alpha-2 (e.g. US, GB).';
COMMENT ON COLUMN public.member_profiles.language IS 'BCP 47 tag (e.g. en, es, pt-BR).';

UPDATE public.member_profiles
SET language = 'en'
WHERE language IS NULL;
