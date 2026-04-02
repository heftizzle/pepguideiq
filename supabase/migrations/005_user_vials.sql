-- Reconstituted vial lifecycle (Pro+). Idempotent policy refresh if split policies existed previously.

CREATE TABLE IF NOT EXISTS public.user_vials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  peptide_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Vial 1',
  reconstituted_at TIMESTAMPTZ NOT NULL,
  vial_size_mg NUMERIC NOT NULL,
  bac_water_ml NUMERIC NOT NULL,
  concentration_mcg_ml NUMERIC GENERATED ALWAYS AS ((vial_size_mg * 1000) / bac_water_ml) STORED,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_vials_user_peptide_idx ON public.user_vials (user_id, peptide_id);
CREATE INDEX IF NOT EXISTS user_vials_user_id_idx ON public.user_vials (user_id);

ALTER TABLE public.user_vials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_vials: select own" ON public.user_vials;
DROP POLICY IF EXISTS "user_vials: insert own" ON public.user_vials;
DROP POLICY IF EXISTS "user_vials: update own" ON public.user_vials;
DROP POLICY IF EXISTS "user_vials: delete own" ON public.user_vials;
DROP POLICY IF EXISTS "Users own their vials" ON public.user_vials;

CREATE POLICY "Users own their vials" ON public.user_vials
  FOR ALL
  USING (auth.uid() = user_id);

GRANT ALL ON public.user_vials TO authenticated;
GRANT ALL ON public.user_vials TO service_role;
