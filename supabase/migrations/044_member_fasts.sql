-- Fasting tracker sessions per member profile (active + history).

CREATE TABLE IF NOT EXISTS public.member_fasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_profile_id uuid NOT NULL REFERENCES public.member_profiles (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  fast_type text NOT NULL,
  started_at timestamptz NOT NULL,
  target_hours numeric NOT NULL,
  ended_at timestamptz,
  notes text,
  public_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_fasts_target_hours_chk
    CHECK (target_hours > 0::numeric AND target_hours <= 2160::numeric),
  CONSTRAINT member_fasts_fast_type_chk
    CHECK (
      fast_type = ANY (
        ARRAY[
          'water_fast'::text,
          'liquid_fast'::text,
          'labs_fast'::text,
          'intermittent_fasting'::text,
          'evoo_fast'::text,
          'sardine_fast'::text
        ]
      )
    )
);

CREATE INDEX IF NOT EXISTS member_fasts_profile_idx
  ON public.member_fasts (member_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS member_fasts_user_idx
  ON public.member_fasts (user_id);

-- At most one in-progress fast per profile (ended_at IS NULL).
CREATE UNIQUE INDEX IF NOT EXISTS member_fasts_one_active_per_profile
  ON public.member_fasts (member_profile_id)
  WHERE ended_at IS NULL;

ALTER TABLE public.member_fasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_fasts: select own profile"
  ON public.member_fasts FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.member_profiles mp
      WHERE mp.id = member_profile_id
        AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "member_fasts: insert own profile"
  ON public.member_fasts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.member_profiles mp
      WHERE mp.id = member_profile_id
        AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "member_fasts: update own profile"
  ON public.member_fasts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.member_profiles mp
      WHERE mp.id = member_profile_id
        AND mp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.member_profiles mp
      WHERE mp.id = member_profile_id
        AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "member_fasts: delete own profile"
  ON public.member_fasts FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.member_profiles mp
      WHERE mp.id = member_profile_id
        AND mp.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_fasts TO authenticated;
GRANT ALL ON public.member_fasts TO service_role;

COMMENT ON TABLE public.member_fasts IS 'Fasting sessions: one open fast per member_profile (ended_at null); target_hours for progress; public_visible exposes active fast on public profile.';
COMMENT ON COLUMN public.member_fasts.target_hours IS 'Goal length in hours (e.g. 48 for 48h, 336 for 14 days).';
COMMENT ON COLUMN public.member_fasts.public_visible IS 'When true and fast is active (ended_at null), worker may expose summary on public member profile.';
