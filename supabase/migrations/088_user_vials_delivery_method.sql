ALTER TABLE public.user_vials
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'injection'
    CHECK (delivery_method IN ('injection', 'intranasal_spray', 'oral'));

ALTER TABLE public.user_vials
  ADD COLUMN IF NOT EXISTS spray_volume_ml double precision DEFAULT NULL;

COMMENT ON COLUMN public.user_vials.delivery_method IS
  'Per-vial route. Defaults to injection; intranasal_spray and oral set by user.';
COMMENT ON COLUMN public.user_vials.spray_volume_ml IS
  'Volume per actuation (mL); only meaningful when delivery_method = intranasal_spray.';
