-- H3: updated_at + set_updated_at() on additional tables (function from 001_initial_schema.sql).
-- H4: body_metrics RLS scoped by member_profiles ownership (EXISTS).
-- H9: member_profiles.avatar_url must be Worker R2 URLs only (or null).

-- ─── H3: columns + triggers ─────────────────────────────────────────────────

ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.member_fasts
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.member_follows
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.network_feed
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- body_metrics.updated_at exists from 016_body_metrics_columns.sql; ensure trigger only.

DROP TRIGGER IF EXISTS shopping_lists_updated_at ON public.shopping_lists;
CREATE TRIGGER shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS body_metrics_updated_at ON public.body_metrics;
CREATE TRIGGER body_metrics_updated_at
  BEFORE UPDATE ON public.body_metrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS member_fasts_updated_at ON public.member_fasts;
CREATE TRIGGER member_fasts_updated_at
  BEFORE UPDATE ON public.member_fasts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS notifications_updated_at ON public.notifications;
CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS member_follows_updated_at ON public.member_follows;
CREATE TRIGGER member_follows_updated_at
  BEFORE UPDATE ON public.member_follows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS network_feed_updated_at ON public.network_feed;
CREATE TRIGGER network_feed_updated_at
  BEFORE UPDATE ON public.network_feed
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── H4: body_metrics RLS (EXISTS on member_profiles) ───────────────────────

DROP POLICY IF EXISTS "body_metrics: select scoped" ON public.body_metrics;
DROP POLICY IF EXISTS "body_metrics: insert scoped" ON public.body_metrics;
DROP POLICY IF EXISTS "body_metrics: update scoped" ON public.body_metrics;
DROP POLICY IF EXISTS "body_metrics: delete scoped" ON public.body_metrics;

CREATE POLICY "body_metrics: select scoped"
  ON public.body_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.member_profiles mp
      WHERE mp.id = body_metrics.profile_id
        AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "body_metrics: insert scoped"
  ON public.body_metrics FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.member_profiles mp
      WHERE mp.id = body_metrics.profile_id
        AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "body_metrics: update scoped"
  ON public.body_metrics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.member_profiles mp
      WHERE mp.id = body_metrics.profile_id
        AND mp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.member_profiles mp
      WHERE mp.id = body_metrics.profile_id
        AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "body_metrics: delete scoped"
  ON public.body_metrics FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.member_profiles mp
      WHERE mp.id = body_metrics.profile_id
        AND mp.user_id = auth.uid()
    )
  );

-- ─── H9: avatar_url Worker path check ───────────────────────────────────────

UPDATE public.member_profiles
SET avatar_url = NULL
WHERE avatar_url IS NOT NULL
  AND NOT (
    avatar_url ~ '^https://[a-z0-9.-]+\.workers\.dev/(avatars|stack-photos)/'
  );

ALTER TABLE public.member_profiles
  DROP CONSTRAINT IF EXISTS member_profiles_avatar_url_worker_path_chk;

ALTER TABLE public.member_profiles
  ADD CONSTRAINT member_profiles_avatar_url_worker_path_chk
  CHECK (
    avatar_url IS NULL
    OR avatar_url ~ '^https://[a-z0-9.-]+\.workers\.dev/(avatars|stack-photos)/'
  );
