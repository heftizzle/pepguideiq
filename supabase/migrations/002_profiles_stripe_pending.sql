-- PepGuideIQ — Stripe customer id + scheduled downgrade placeholders on user profile.
-- `public.profiles` mirrors each auth user (often referred to as the app "users" row).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id   TEXT,
  ADD COLUMN IF NOT EXISTS pending_plan         TEXT,
  ADD COLUMN IF NOT EXISTS pending_plan_date    TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe Customer id (cus_…); set by checkout/webhook with service role.';
COMMENT ON COLUMN public.profiles.pending_plan IS 'Optional target plan for a scheduled downgrade (e.g. entry) once billing period ends.';
COMMENT ON COLUMN public.profiles.pending_plan_date IS 'Typically mirrors Stripe current_period_end (timestamptz) when downgrade was scheduled.';
