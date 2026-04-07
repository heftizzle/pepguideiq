-- Non-injectable protocol logs: count + unit, optional session; vial_id / dose_mcg optional.

ALTER TABLE public.dose_logs
  ADD COLUMN IF NOT EXISTS dose_count INTEGER,
  ADD COLUMN IF NOT EXISTS dose_unit TEXT,
  ADD COLUMN IF NOT EXISTS protocol_session TEXT;

ALTER TABLE public.dose_logs
  ALTER COLUMN dose_mcg DROP NOT NULL;

COMMENT ON COLUMN public.dose_logs.dose_count IS 'Non-injectable: number of caps, sprays, applications, etc.';
COMMENT ON COLUMN public.dose_logs.dose_unit IS 'Non-injectable unit label (caps, tablets, sprays, applications).';
COMMENT ON COLUMN public.dose_logs.protocol_session IS 'Protocol session when logged: morning, afternoon, evening, night.';
