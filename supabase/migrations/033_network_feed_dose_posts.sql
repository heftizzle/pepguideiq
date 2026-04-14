-- Ephemeral "dose posted to network" rows (72h TTL). Distinct from `get_network_feed()` stack listing.

CREATE TABLE IF NOT EXISTS public.network_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  dose_log_id uuid NOT NULL REFERENCES public.dose_logs (id) ON DELETE CASCADE,
  compound_id text NOT NULL,
  dose_amount numeric,
  dose_unit text,
  route text,
  session_label text,
  stack_id uuid REFERENCES public.user_stacks (id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (timezone ('utc', now ()) + interval '72 hours'),
  created_at timestamptz NOT NULL DEFAULT timezone ('utc', now ()),
  CONSTRAINT network_feed_dose_log_unique UNIQUE (dose_log_id)
);

CREATE INDEX IF NOT EXISTS network_feed_user_created_idx
  ON public.network_feed (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS network_feed_expires_idx
  ON public.network_feed (expires_at);

COMMENT ON TABLE public.network_feed IS
  'Optional public-style dose highlights; expires after 72h. RLS: insert/select own rows.';

ALTER TABLE public.network_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "network_feed: insert own" ON public.network_feed;
CREATE POLICY "network_feed: insert own"
  ON public.network_feed FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "network_feed: select own" ON public.network_feed;
CREATE POLICY "network_feed: select own"
  ON public.network_feed FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.network_feed TO authenticated;
GRANT ALL ON public.network_feed TO service_role;
