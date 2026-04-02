-- Dose logs for Vial Tracker. Idempotent policy refresh if split policies existed previously.

CREATE TABLE IF NOT EXISTS public.dose_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vial_id UUID NOT NULL REFERENCES public.user_vials(id) ON DELETE CASCADE,
  peptide_id TEXT NOT NULL,
  dosed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dose_mcg NUMERIC NOT NULL,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS dose_logs_user_peptide_dosed_idx
  ON public.dose_logs (user_id, peptide_id, dosed_at DESC);
CREATE INDEX IF NOT EXISTS dose_logs_vial_idx ON public.dose_logs (vial_id);

ALTER TABLE public.dose_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dose_logs: select own" ON public.dose_logs;
DROP POLICY IF EXISTS "dose_logs: insert own" ON public.dose_logs;
DROP POLICY IF EXISTS "dose_logs: update own" ON public.dose_logs;
DROP POLICY IF EXISTS "dose_logs: delete own" ON public.dose_logs;
DROP POLICY IF EXISTS "Users own their dose logs" ON public.dose_logs;

CREATE POLICY "Users own their dose logs" ON public.dose_logs
  FOR ALL
  USING (auth.uid() = user_id);

GRANT ALL ON public.dose_logs TO authenticated;
GRANT ALL ON public.dose_logs TO service_role;
