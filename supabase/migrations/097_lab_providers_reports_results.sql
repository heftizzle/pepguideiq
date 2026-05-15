-- Lab reports + normalized marker rows: R2-backed uploads, optional provider FK, dual ownership like inbody_scan_history.

CREATE TABLE IF NOT EXISTS public.lab_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  aliases jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT lab_providers_name_key UNIQUE (name)
);

COMMENT ON TABLE public.lab_providers IS
  'Reference lab brands / networks (Quest, LabCorp, specialty cardio labs). Aliases are alternate spellings as JSON array of strings.';
COMMENT ON COLUMN public.lab_providers.aliases IS 'Alternate labels for matching uploads or UI (JSON array of strings).';

INSERT INTO public.lab_providers (name, aliases)
VALUES
  ('Quest Diagnostics', '[]'::jsonb),
  ('LabCorp', '[]'::jsonb),
  ('Cleveland HeartLab', '["CardioIQ","Cleveland Heart Lab"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.lab_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.member_profiles (id) ON DELETE CASCADE,
  r2_key text NOT NULL,
  date_drawn date,
  lab_provider_id uuid REFERENCES public.lab_providers (id) ON DELETE SET NULL,
  report_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_text text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT lab_reports_report_type_check CHECK (
    report_type IN ('pdf_parsed', 'structured_manual', 'manual_entry')
  )
);

CREATE INDEX IF NOT EXISTS lab_reports_profile_type_date_drawn_idx
  ON public.lab_reports (profile_id, report_type, date_drawn DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS lab_reports_profile_created_at_idx
  ON public.lab_reports (profile_id, created_at DESC);

-- Same specimen date + same report type = one row per profile (upsert target); prevents duplicate rows from repeat uploads.
ALTER TABLE public.lab_reports
  ADD CONSTRAINT lab_reports_profile_date_type_unique
  UNIQUE (profile_id, date_drawn, report_type);

COMMENT ON TABLE public.lab_reports IS
  'User-uploaded lab PDF/image artifacts (r2_key) plus parsing metadata; scoped to auth.users + member_profiles like inbody_scan_history.';
COMMENT ON COLUMN public.lab_reports.r2_key IS 'R2 object key only (no cache-bust query params persisted).';
COMMENT ON COLUMN public.lab_reports.metadata IS 'Parser version, page hints, checksums, etc.';

CREATE TABLE IF NOT EXISTS public.lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.lab_reports (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.member_profiles (id) ON DELETE CASCADE,
  canonical_key text NOT NULL,
  raw_name text,
  value_numeric numeric,
  value_text text,
  unit text,
  ref_low numeric,
  ref_high numeric,
  in_range boolean,
  flag text,
  date_drawn date,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS lab_results_profile_canonical_date_drawn_idx
  ON public.lab_results (profile_id, canonical_key, date_drawn DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS lab_results_report_id_idx
  ON public.lab_results (report_id);

COMMENT ON TABLE public.lab_results IS
  'Structured markers extracted from a lab_reports row; trend queries via profile_id + canonical_key + date_drawn.';

-- Reference catalog: readable by any signed-in user; mutations via migrations / service role only.
ALTER TABLE public.lab_providers ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.lab_providers TO authenticated;

DROP POLICY IF EXISTS "lab_providers: select authenticated" ON public.lab_providers;
CREATE POLICY "lab_providers: select authenticated"
  ON public.lab_providers FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "lab_providers: select authenticated" ON public.lab_providers IS
  'All authenticated clients may read the seeded provider catalog.';

ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.lab_reports TO authenticated;

DROP POLICY IF EXISTS "lab_reports: select scoped" ON public.lab_reports;
CREATE POLICY "lab_reports: select scoped"
  ON public.lab_reports FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = lab_reports.profile_id AND mp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "lab_reports: insert scoped" ON public.lab_reports;
CREATE POLICY "lab_reports: insert scoped"
  ON public.lab_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = lab_reports.profile_id AND mp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "lab_reports: delete scoped" ON public.lab_reports;
CREATE POLICY "lab_reports: delete scoped"
  ON public.lab_reports FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = lab_reports.profile_id AND mp.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "lab_reports: delete scoped" ON public.lab_reports IS
  'Owner may delete own lab report rows (cascade removes lab_results).';

ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.lab_results TO authenticated;

DROP POLICY IF EXISTS "lab_results: select scoped" ON public.lab_results;
CREATE POLICY "lab_results: select scoped"
  ON public.lab_results FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = lab_results.profile_id AND mp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "lab_results: insert scoped" ON public.lab_results;
CREATE POLICY "lab_results: insert scoped"
  ON public.lab_results FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = lab_results.profile_id AND mp.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.lab_reports lr
      WHERE lr.id = lab_results.report_id
        AND lr.user_id = auth.uid()
        AND lr.profile_id = lab_results.profile_id
    )
  );

DROP POLICY IF EXISTS "lab_results: delete scoped" ON public.lab_results;
CREATE POLICY "lab_results: delete scoped"
  ON public.lab_results FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = lab_results.profile_id AND mp.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "lab_results: delete scoped" ON public.lab_results IS
  'Owner delete for cascades from lab_reports and direct cleanup if needed.';
