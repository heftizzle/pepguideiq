-- V2: consent flag for future menstrual cycle tracking (no UI yet).

ALTER TABLE public.profiles
ADD COLUMN cycle_tracking_enabled boolean;

COMMENT ON COLUMN public.profiles.cycle_tracking_enabled IS
'V2: user consent for menstrual cycle tracking. null = not asked; false = skipped (do not ask again); true = enabled.';
