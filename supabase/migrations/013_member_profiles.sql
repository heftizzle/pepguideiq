-- Multi-profile (Netflix-style) slots per account.
-- NOTE: public.profiles remains the 1:1 account row (id = auth user id, plan, billing).
--       public.member_profiles holds 1–4 named profiles per user (tier-dependent).

CREATE TABLE IF NOT EXISTS public.member_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS member_profiles_user_id_idx ON public.member_profiles (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS member_profiles_one_default_per_user
  ON public.member_profiles (user_id)
  WHERE is_default = true;

ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can list/update their own member profiles; creation is via Worker (service role).
CREATE POLICY "member_profiles: select own"
  ON public.member_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "member_profiles: update own"
  ON public.member_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, UPDATE ON public.member_profiles TO authenticated;
GRANT ALL ON public.member_profiles TO service_role;

-- ── Scoped data: nullable profile_id (backfill then enforce NOT NULL in a follow-up) ──

ALTER TABLE public.user_stacks
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.member_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_vials
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.member_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.dose_logs
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.member_profiles(id) ON DELETE CASCADE;

-- Placeholder for future per-profile body metric history (account-level metrics stay on public.profiles for now).
CREATE TABLE IF NOT EXISTS public.body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS body_metrics_profile_id_idx ON public.body_metrics (profile_id);
CREATE INDEX IF NOT EXISTS body_metrics_user_id_idx ON public.body_metrics (user_id);

ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "body_metrics: all own"
  ON public.body_metrics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.body_metrics TO authenticated;
GRANT ALL ON public.body_metrics TO service_role;

-- ── Backfill: one default member_profile per account + link existing rows ──

INSERT INTO public.member_profiles (user_id, display_name, is_default)
SELECT
  p.id,
  COALESCE(NULLIF(trim(p.display_name), ''), NULLIF(trim(p.name), ''), split_part(p.email, '@', 1), 'Profile'),
  true
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.member_profiles mp WHERE mp.user_id = p.id);

UPDATE public.user_stacks us
SET profile_id = mp.id
FROM public.member_profiles mp
WHERE us.user_id = mp.user_id
  AND mp.is_default = true
  AND us.profile_id IS NULL;

UPDATE public.user_vials uv
SET profile_id = mp.id
FROM public.member_profiles mp
WHERE uv.user_id = mp.user_id
  AND mp.is_default = true
  AND uv.profile_id IS NULL;

UPDATE public.dose_logs dl
SET profile_id = v.profile_id
FROM public.user_vials v
WHERE dl.vial_id = v.id
  AND dl.profile_id IS NULL
  AND v.profile_id IS NOT NULL;

-- Remaining dose_logs without vial match: attach to default member profile
UPDATE public.dose_logs dl
SET profile_id = mp.id
FROM public.member_profiles mp
WHERE dl.user_id = mp.user_id
  AND mp.is_default = true
  AND dl.profile_id IS NULL;

ALTER TABLE public.user_stacks DROP CONSTRAINT IF EXISTS user_stacks_user_id_unique;

ALTER TABLE public.user_stacks
  ADD CONSTRAINT user_stacks_user_profile_unique UNIQUE (user_id, profile_id);

CREATE INDEX IF NOT EXISTS user_stacks_profile_id_idx ON public.user_stacks (profile_id);

-- ── RLS: user_stacks ──

DROP POLICY IF EXISTS "user_stacks: select own" ON public.user_stacks;
DROP POLICY IF EXISTS "user_stacks: insert own" ON public.user_stacks;
DROP POLICY IF EXISTS "user_stacks: update own" ON public.user_stacks;
DROP POLICY IF EXISTS "user_stacks: delete own" ON public.user_stacks;

CREATE POLICY "user_stacks: select own"
  ON public.user_stacks FOR SELECT
  USING (
    auth.uid() = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = user_stacks.profile_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "user_stacks: insert own"
  ON public.user_stacks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = user_stacks.profile_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "user_stacks: update own"
  ON public.user_stacks FOR UPDATE
  USING (
    auth.uid() = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = user_stacks.profile_id AND mp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = user_stacks.profile_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "user_stacks: delete own"
  ON public.user_stacks FOR DELETE
  USING (
    auth.uid() = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = user_stacks.profile_id AND mp.user_id = auth.uid()
    )
  );

-- ── RLS: user_vials ──

DROP POLICY IF EXISTS "Users own their vials" ON public.user_vials;

CREATE POLICY "Users own their vials"
  ON public.user_vials FOR ALL
  USING (
    auth.uid() = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = user_vials.profile_id AND mp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = user_vials.profile_id AND mp.user_id = auth.uid()
    )
  );

-- ── RLS: dose_logs ──

DROP POLICY IF EXISTS "Users own their dose logs" ON public.dose_logs;

CREATE POLICY "Users own their dose logs"
  ON public.dose_logs FOR ALL
  USING (
    auth.uid() = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = dose_logs.profile_id AND mp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = dose_logs.profile_id AND mp.user_id = auth.uid()
    )
  );

-- ── Signup: default member profile + scoped stack row ──

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mid UUID;
BEGIN
  INSERT INTO public.profiles (id, email, name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'entry')
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT id INTO mid FROM public.member_profiles WHERE user_id = NEW.id LIMIT 1;
  IF mid IS NULL THEN
    INSERT INTO public.member_profiles (user_id, display_name, is_default)
    VALUES (
      NEW.id,
      COALESCE(
        NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
        split_part(NEW.email, '@', 1)
      ),
      true
    )
    RETURNING id INTO mid;

    INSERT INTO public.user_stacks (user_id, stack, profile_id)
    VALUES (NEW.id, '[]'::jsonb, mid);
  END IF;

  RETURN NEW;
END;
$$;

-- ── Profile tab stats scoped to active member profile ──

DROP FUNCTION IF EXISTS public.get_user_profile_stats();

CREATE OR REPLACE FUNCTION public.get_user_profile_stats(p_profile_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid UUID;
BEGIN
  IF p_profile_id IS NULL THEN
    SELECT id INTO pid
    FROM public.member_profiles
    WHERE user_id = auth.uid() AND is_default = true
    ORDER BY created_at ASC
    LIMIT 1;
  ELSE
    SELECT id INTO pid
    FROM public.member_profiles
    WHERE id = p_profile_id AND user_id = auth.uid()
    LIMIT 1;
    IF pid IS NULL THEN
      RAISE EXCEPTION 'invalid profile';
    END IF;
  END IF;

  IF pid IS NULL THEN
    RETURN jsonb_build_object(
      'dose_count', 0,
      'peptide_distinct', 0,
      'active_vials', 0,
      'days_tracked', 0
    );
  END IF;

  RETURN jsonb_build_object(
    'dose_count',
    COALESCE((SELECT COUNT(*)::int FROM public.dose_logs WHERE user_id = auth.uid() AND profile_id = pid), 0),
    'peptide_distinct',
    COALESCE(
      (SELECT COUNT(DISTINCT peptide_id)::int FROM public.dose_logs WHERE user_id = auth.uid() AND profile_id = pid),
      0
    ),
    'active_vials',
    COALESCE(
      (SELECT COUNT(*)::int FROM public.user_vials WHERE user_id = auth.uid() AND profile_id = pid AND status = 'active'),
      0
    ),
    'days_tracked',
    COALESCE(
      (
        SELECT COUNT(DISTINCT ((dosed_at AT TIME ZONE 'UTC')::date))::int
        FROM public.dose_logs
        WHERE user_id = auth.uid() AND profile_id = pid
      ),
      0
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_profile_stats(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_profile_stats(UUID) TO authenticated;

COMMENT ON TABLE public.member_profiles IS 'Netflix-style sub-profiles; tier limits enforced when creating via API Worker.';
COMMENT ON COLUMN public.user_stacks.profile_id IS 'Scopes saved stack to a member profile; pair (user_id, profile_id) is unique.';
