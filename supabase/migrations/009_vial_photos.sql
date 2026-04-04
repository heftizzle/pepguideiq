-- Vial Tracker: optional R2 keys for per-vial photos; profile keys for Vials-tab hero stack shots.
-- Also: stop CASCADE-deleting dose_logs when a vial is removed (preserve dose history).

ALTER TABLE public.user_vials
  ADD COLUMN IF NOT EXISTS vial_photo_r2_key TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stack_shot_1_r2_key TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stack_shot_2_r2_key TEXT;

COMMENT ON COLUMN public.user_vials.vial_photo_r2_key IS 'R2 object key, e.g. {user_id}/vials/{vial_id}.jpg; served via Worker GET /stack-photo?key=';
COMMENT ON COLUMN public.profiles.stack_shot_1_r2_key IS 'R2 key for Vials tab hero slot 1, e.g. {user_id}/stack-shot-1.jpg';
COMMENT ON COLUMN public.profiles.stack_shot_2_r2_key IS 'R2 key for Vials tab hero slot 2, e.g. {user_id}/stack-shot-2.jpg';

-- Deleting a vial must not delete dose_logs (history stays; vial_id becomes NULL).
ALTER TABLE public.dose_logs DROP CONSTRAINT IF EXISTS dose_logs_vial_id_fkey;
ALTER TABLE public.dose_logs ALTER COLUMN vial_id DROP NOT NULL;
ALTER TABLE public.dose_logs
  ADD CONSTRAINT dose_logs_vial_id_fkey
  FOREIGN KEY (vial_id) REFERENCES public.user_vials(id) ON DELETE SET NULL;
