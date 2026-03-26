-- ─────────────────────────────────────────────────────────────────────────────
-- PepGuideIQ — Supabase Migration
-- File: supabase/migrations/001_initial_schema.sql
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- Or via CLI:  supabase db push
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. USER PROFILES ─────────────────────────────────────────────────────────
-- Mirrors auth.users but adds plan tier and display name.
-- Auto-populated via trigger when a new user signs up.

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  name        TEXT,
  plan        TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast plan lookups (used by Worker rate limiter)
CREATE INDEX IF NOT EXISTS profiles_plan_idx ON public.profiles(plan);


-- ── 2. USER STACKS ────────────────────────────────────────────────────────────
-- Each user has one row. Stack is stored as JSONB array of peptide entries.
-- Schema of each entry mirrors the React stackEntry shape:
-- {
--   id:             string,   -- peptide id from catalog
--   name:           string,
--   category:       string,
--   stackDose:      string,
--   stackFrequency: string,
--   stackNotes:     string,
--   addedDate:      string
-- }

CREATE TABLE IF NOT EXISTS public.user_stacks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stack       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_stacks_user_id_unique UNIQUE (user_id)
);

-- Index for fast user_id lookups
CREATE INDEX IF NOT EXISTS user_stacks_user_id_idx ON public.user_stacks(user_id);


-- ── 3. AI QUERY LOG ───────────────────────────────────────────────────────────
-- Tracks AI Advisor usage per user for rate limiting and analytics.
-- The Cloudflare Worker can also use KV for this — this is the persistent log.

CREATE TABLE IF NOT EXISTS public.ai_queries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query       TEXT        NOT NULL,
  tokens_used INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for counting queries per user per day (rate limiting)
CREATE INDEX IF NOT EXISTS ai_queries_user_date_idx
  ON public.ai_queries(user_id, created_at DESC);


-- ── 4. ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- Every table is locked down. Users can only see and modify their own data.

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_queries  ENABLE ROW LEVEL SECURITY;

-- profiles: users can read and update only their own row
CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- user_stacks: full CRUD on own row only
CREATE POLICY "user_stacks: select own"
  ON public.user_stacks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_stacks: insert own"
  ON public.user_stacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_stacks: update own"
  ON public.user_stacks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_stacks: delete own"
  ON public.user_stacks FOR DELETE
  USING (auth.uid() = user_id);

-- ai_queries: users can insert and read their own queries
CREATE POLICY "ai_queries: select own"
  ON public.ai_queries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_queries: insert own"
  ON public.ai_queries FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ── 5. AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────────────────────
-- Trigger fires after a new row is inserted into auth.users.
-- Pulls name and plan from user_metadata (set during signUp call).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'free')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Also create an empty stack row for the new user
  INSERT INTO public.user_stacks (user_id, stack)
  VALUES (NEW.id, '[]'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ── 6. AUTO-UPDATE updated_at ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER user_stacks_updated_at
  BEFORE UPDATE ON public.user_stacks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 7. PLAN UPGRADE HELPER ────────────────────────────────────────────────────
-- Called by your RevenueCat / Stripe webhook (via a Supabase Edge Function)
-- to update a user's plan after a successful payment.
-- Usage: SELECT update_user_plan('user-uuid-here', 'pro');

CREATE OR REPLACE FUNCTION public.update_user_plan(
  p_user_id UUID,
  p_plan    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate plan value
  IF p_plan NOT IN ('free', 'pro', 'elite') THEN
    RAISE EXCEPTION 'Invalid plan: %', p_plan;
  END IF;

  -- Update profiles table
  UPDATE public.profiles
  SET plan = p_plan, updated_at = NOW()
  WHERE id = p_user_id;

  -- Sync to auth.users metadata so the JWT contains the latest plan
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('plan', p_plan)
  WHERE id = p_user_id;
END;
$$;


-- ── 8. DAILY AI QUERY COUNT HELPER ───────────────────────────────────────────
-- Returns the number of AI queries a user has made today.
-- Used by the Worker / app to enforce free plan rate limits.
-- Usage: SELECT get_daily_ai_count('user-uuid-here');

CREATE OR REPLACE FUNCTION public.get_daily_ai_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.ai_queries
  WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE::TIMESTAMPTZ
    AND created_at < (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Done. Tables created:
--   public.profiles      — user account + plan tier
--   public.user_stacks   — saved peptide stack (JSONB)
--   public.ai_queries    — AI Advisor usage log
--
-- Triggers:
--   on_auth_user_created — auto-creates profile + empty stack on signup
--   profiles_updated_at  — keeps updated_at current
--   user_stacks_updated_at
--
-- Functions:
--   update_user_plan(uuid, text) — called by payment webhook
--   get_daily_ai_count(uuid)     — rate limit helper
-- ─────────────────────────────────────────────────────────────────────────────
