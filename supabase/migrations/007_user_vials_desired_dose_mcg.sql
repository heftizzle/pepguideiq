ALTER TABLE public.user_vials
  ADD COLUMN IF NOT EXISTS desired_dose_mcg NUMERIC;
