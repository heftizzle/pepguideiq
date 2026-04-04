-- Per–member-profile body metrics (goal, weight, height, body fat, unit).
-- public.profiles keeps account-level fields (email, plan, default_session, display_name, etc.).

ALTER TABLE public.body_metrics
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS weight_lbs NUMERIC,
  ADD COLUMN IF NOT EXISTS height_in NUMERIC,
  ADD COLUMN IF NOT EXISTS body_fat_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS weight_unit TEXT NOT NULL DEFAULT 'lbs',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Remove stub rows without a profile (placeholder rows only).
DELETE FROM public.body_metrics WHERE profile_id IS NULL;

-- One snapshot row per member profile.
INSERT INTO public.body_metrics (user_id, profile_id, goal, weight_lbs, height_in, body_fat_pct, weight_unit, updated_at)
SELECT
  mp.user_id,
  mp.id,
  CASE WHEN mp.is_default THEN p.goal ELSE NULL END,
  CASE WHEN mp.is_default THEN p.weight_lbs ELSE NULL END,
  CASE WHEN mp.is_default THEN p.height_in ELSE NULL END,
  CASE WHEN mp.is_default THEN p.body_fat_pct ELSE NULL END,
  CASE
    WHEN mp.is_default AND trim(COALESCE(p.weight_unit, '')) = 'kg' THEN 'kg'
    ELSE 'lbs'
  END,
  now()
FROM public.member_profiles mp
JOIN public.profiles p ON p.id = mp.user_id
WHERE NOT EXISTS (SELECT 1 FROM public.body_metrics bm WHERE bm.profile_id = mp.id);

ALTER TABLE public.body_metrics
  ALTER COLUMN profile_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS body_metrics_user_profile_unique
  ON public.body_metrics (user_id, profile_id);

DROP POLICY IF EXISTS "body_metrics: all own" ON public.body_metrics;

CREATE POLICY "body_metrics: select scoped"
  ON public.body_metrics FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = body_metrics.profile_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "body_metrics: insert scoped"
  ON public.body_metrics FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = body_metrics.profile_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "body_metrics: update scoped"
  ON public.body_metrics FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = body_metrics.profile_id AND mp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = body_metrics.profile_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "body_metrics: delete scoped"
  ON public.body_metrics FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = body_metrics.profile_id AND mp.user_id = auth.uid()
    )
  );
