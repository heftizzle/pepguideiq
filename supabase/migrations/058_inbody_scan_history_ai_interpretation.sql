-- Cached AI interpretation for trends (one stored interpretation per scan row; Worker updates via service role).

ALTER TABLE public.inbody_scan_history
  ADD COLUMN IF NOT EXISTS ai_interpretation text,
  ADD COLUMN IF NOT EXISTS ai_interpreted_at timestamptz;

COMMENT ON COLUMN public.inbody_scan_history.ai_interpretation IS
  'Sonnet trends interpretation text; set by Worker POST /inbody-scan/interpret.';

COMMENT ON COLUMN public.inbody_scan_history.ai_interpreted_at IS
  'When ai_interpretation was last written (UTC).';
