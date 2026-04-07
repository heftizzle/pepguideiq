-- Network discovery feed: saved stacks (public.user_stacks) opted in with feed_visible.

ALTER TABLE public.user_stacks
  ADD COLUMN IF NOT EXISTS feed_visible BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_stacks.feed_visible IS
  'When true, stack is listed in the in-app Network feed for authenticated users (share_id required).';

CREATE INDEX IF NOT EXISTS user_stacks_feed_visible_created_idx
  ON public.user_stacks (created_at DESC)
  WHERE feed_visible = true;

-- Authenticated users may read any row in the feed (OR with existing "select own" policy).
DROP POLICY IF EXISTS "user_stacks: select network feed" ON public.user_stacks;

CREATE POLICY "user_stacks: select network feed"
  ON public.user_stacks FOR SELECT
  TO authenticated
  USING (feed_visible = true);

-- Aggregated feed: joins member_profiles + profiles; exposes pepguideIQ score (same formula as get_user_profile_stats).
CREATE OR REPLACE FUNCTION public.get_network_feed()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'share_id', sub.share_id,
          'stack_name', sub.stack_name,
          'compound_count', sub.compound_count,
          'handle', sub.handle,
          'display_name', sub.display_name,
          'tier', sub.tier,
          'pepguideiq_score', sub.pepguideiq_score,
          'created_at', sub.created_at
        )
        ORDER BY sub.created_at DESC
      )
      FROM (
        SELECT
          us.share_id AS share_id,
          COALESCE(NULLIF(trim(us.stack_name), ''), 'Stack') AS stack_name,
          COALESCE(jsonb_array_length(COALESCE(us.stack, '[]'::jsonb)), 0) AS compound_count,
          mp.handle AS handle,
          mp.display_name AS display_name,
          p.plan::text AS tier,
          (
            COALESCE(
              (SELECT COUNT(*)::int FROM public.dose_logs dl WHERE dl.user_id = mp.user_id AND dl.profile_id = mp.id),
              0
            )
            * 2
            + COALESCE(
              (SELECT COUNT(DISTINCT dl.peptide_id)::int FROM public.dose_logs dl WHERE dl.user_id = mp.user_id AND dl.profile_id = mp.id),
              0
            )
            * 3
            + COALESCE(
              (SELECT COUNT(*)::int FROM public.user_vials uv WHERE uv.user_id = mp.user_id AND uv.profile_id = mp.id AND uv.status = 'active'),
              0
            )
            * 1
            + COALESCE(
              (
                SELECT COUNT(DISTINCT ((dl.dosed_at AT TIME ZONE 'UTC')::date))::int
                FROM public.dose_logs dl
                WHERE dl.user_id = mp.user_id AND dl.profile_id = mp.id
              ),
              0
            )
            * 1
          ) AS pepguideiq_score,
          us.created_at AS created_at
        FROM public.user_stacks us
        INNER JOIN public.member_profiles mp ON mp.id = us.profile_id
        INNER JOIN public.profiles p ON p.id = mp.user_id
        WHERE us.feed_visible = true
          AND us.share_id IS NOT NULL
          AND btrim(us.share_id) <> ''
        ORDER BY us.created_at DESC
        LIMIT 200
      ) sub
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_network_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_network_feed() TO authenticated;

COMMENT ON FUNCTION public.get_network_feed() IS
  'Authenticated: list network-visible stacks with owner handle, display_name, plan tier, and pepguideIQ score; ordered by stack row created_at DESC.';
