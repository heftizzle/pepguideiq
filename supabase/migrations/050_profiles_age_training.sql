-- Age and training experience for protocol safety and AI context.
-- Numbered 050 because 049 is profiles cycle_tracking_enabled.

ALTER TABLE public.profiles
ADD COLUMN date_of_birth date,
ADD COLUMN training_experience text
  CHECK (
    training_experience IS NULL
    OR training_experience IN (
      'beginner',
      'intermediate',
      'advanced',
      'elite'
    )
  );

COMMENT ON COLUMN public.profiles.date_of_birth IS
'Used to calculate age for protocol safety and AI personalization.';

COMMENT ON COLUMN public.profiles.training_experience IS
'Self-reported training experience level for protocol recommendations.';
