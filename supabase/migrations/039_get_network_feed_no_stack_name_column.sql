-- 030 reintroduced user_stacks.stack_name in get_network_feed, but that column was dropped in 011.
-- This restores a valid function body (share_id-based label, display_handle, updated_at).

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
          'updated_at', sub.updated_at
        )
        ORDER BY sub.updated_at DESC
      )
      FROM (
        SELECT
          us.share_id AS share_id,
          COALESCE(NULLIF(btrim(us.share_id), ''), 'My Stack') AS stack_name,
          COALESCE(jsonb_array_length(COALESCE(us.stack, '[]'::jsonb)), 0) AS compound_count,
          COALESCE(NULLIF(trim(mp.display_handle), ''), mp.handle) AS handle,
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
          us.updated_at AS updated_at
        FROM public.user_stacks us
        INNER JOIN public.member_profiles mp ON mp.id = us.profile_id
        INNER JOIN public.profiles p ON p.id = mp.user_id
        WHERE us.feed_visible = true
          AND us.share_id IS NOT NULL
          AND btrim(us.share_id) <> ''
        ORDER BY us.updated_at DESC
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
  'Authenticated: network-visible stacks; stack_name from share_id; display_handle when set; pepguideIQ score; updated_at.';
