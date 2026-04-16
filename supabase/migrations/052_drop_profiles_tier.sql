-- `profiles.plan` is the sole billing tier (entry|pro|elite|goat). Column `tier` (051) duplicated it
-- without any app reads or trigger updates — drop to avoid drift from `update_user_plan`.

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS tier;
