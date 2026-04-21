-- Idempotent: stripe_customer_id already exists in production (applied via MCP).
-- Keeps repo migration history aligned; safe if 002_profiles_stripe_pending.sql also ran.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
