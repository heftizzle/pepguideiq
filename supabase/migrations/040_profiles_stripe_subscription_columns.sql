-- Stripe subscription state on account row (profiles.id = auth.users.id).
-- stripe_customer_id already exists from 002_profiles_stripe_pending.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Stripe Subscription id (sub_…) when on a paid recurring plan.';
COMMENT ON COLUMN public.profiles.stripe_price_id IS 'Active recurring Stripe Price id (price_…) for the current subscription item.';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Mirrors Stripe subscription status when applicable (active, past_due, canceled, …); inactive when no subscription.';
