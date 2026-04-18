-- Historical InBody (or similar) composition scan rows: image key in R2 + extracted metrics + raw model JSON.

CREATE TABLE IF NOT EXISTS public.inbody_scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.member_profiles (id) ON DELETE CASCADE,
  r2_key text NOT NULL,
  raw_json jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  scan_date timestamptz,
  weight_lbs numeric,
  lean_mass_lbs numeric,
  smm_lbs numeric,
  pbf_pct numeric,
  fat_mass_lbs numeric,
  inbody_score numeric,
  bmi numeric,
  bmr_kcal numeric,
  visceral_fat_level numeric,
  tbw_l numeric,
  icw_l numeric,
  ecw_l numeric,
  ecw_tbw_ratio numeric,
  seg_lean_r_arm_lbs numeric,
  seg_lean_l_arm_lbs numeric,
  seg_lean_trunk_lbs numeric,
  seg_lean_r_leg_lbs numeric,
  seg_lean_l_leg_lbs numeric,
  seg_fat_r_arm_pct numeric,
  seg_fat_l_arm_pct numeric,
  seg_fat_trunk_pct numeric,
  seg_fat_r_leg_pct numeric,
  seg_fat_l_leg_pct numeric
);

CREATE INDEX IF NOT EXISTS inbody_scan_history_profile_created_idx
  ON public.inbody_scan_history (profile_id, created_at DESC);

COMMENT ON TABLE public.inbody_scan_history IS
  'Pro+ InBody-style scan uploads: R2 image key under user prefix, optional extracted metrics (null = unknown).';

ALTER TABLE public.inbody_scan_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.inbody_scan_history TO authenticated;

DROP POLICY IF EXISTS "inbody_scan_history: select scoped" ON public.inbody_scan_history;
CREATE POLICY "inbody_scan_history: select scoped"
  ON public.inbody_scan_history FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = inbody_scan_history.profile_id AND mp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "inbody_scan_history: insert scoped" ON public.inbody_scan_history;
CREATE POLICY "inbody_scan_history: insert scoped"
  ON public.inbody_scan_history FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = inbody_scan_history.profile_id AND mp.user_id = auth.uid()
    )
  );
