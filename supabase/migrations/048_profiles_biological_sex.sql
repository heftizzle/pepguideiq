-- User biological sex for protocol / AI personalization (dosing, titration, side-effect context).

ALTER TABLE public.profiles
ADD COLUMN biological_sex text
CHECK (biological_sex IN ('male', 'female', 'prefer_not_to_say'));

COMMENT ON COLUMN public.profiles.biological_sex IS
'User biological sex for protocol personalization. Null = not set.';
