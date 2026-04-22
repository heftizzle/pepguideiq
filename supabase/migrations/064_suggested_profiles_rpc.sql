-- Find People: suggested profiles (graph siblings + public stack compound overlap).

CREATE OR REPLACE FUNCTION public.get_suggested_profiles(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.member_profiles mp
    WHERE mp.id = p_profile_id
      AND mp.user_id = auth.uid()
  ) THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE(
    (
      WITH viewer AS (
        SELECT mp.id AS vid, mp.user_id AS vuid
        FROM public.member_profiles mp
        WHERE mp.id = p_profile_id
          AND mp.user_id = auth.uid()
        LIMIT 1
      ),
      viewer_compounds AS (
        SELECT DISTINCT lower(trim(both from elem->>'id')) AS cid
        FROM public.user_stacks us
        CROSS JOIN viewer v
        CROSS JOIN LATERAL jsonb_array_elements(COALESCE(us.stack, '[]'::jsonb)) AS elem
        WHERE us.profile_id = v.vid
          AND elem ? 'id'
          AND length(trim(both from elem->>'id')) > 0
      ),
      other_compounds AS (
        SELECT DISTINCT
          us.profile_id AS profile_id,
          lower(trim(both from elem->>'id')) AS cid,
          coalesce(elem->>'name', '') AS cname_raw
        FROM public.user_stacks us
        INNER JOIN public.member_profiles mp ON mp.id = us.profile_id
        CROSS JOIN viewer v
        CROSS JOIN LATERAL jsonb_array_elements(COALESCE(us.stack, '[]'::jsonb)) AS elem
        WHERE us.feed_visible = true
          AND us.share_id IS NOT NULL
          AND btrim(us.share_id) <> ''
          AND us.profile_id <> v.vid
          AND mp.user_id <> v.vuid
          AND NOT EXISTS (
            SELECT 1
            FROM public.member_follows mf
            WHERE mf.follower_id = v.vid
              AND mf.following_id = us.profile_id
          )
          AND elem ? 'id'
          AND length(trim(both from elem->>'id')) > 0
      ),
      graph_raw AS (
        SELECT mf2.following_id AS suggested_id, mf.follower_id AS via_fan_id
        FROM public.member_follows mf
        INNER JOIN public.member_follows mf2 ON mf2.follower_id = mf.follower_id
        CROSS JOIN viewer v
        INNER JOIN public.member_profiles mp_s ON mp_s.id = mf2.following_id
        WHERE mf.following_id = v.vid
          AND mf2.following_id <> v.vid
          AND mp_s.user_id <> v.vuid
          AND NOT EXISTS (
            SELECT 1
            FROM public.member_follows x
            WHERE x.follower_id = v.vid
              AND x.following_id = mf2.following_id
          )
      ),
      graph_agg AS (
        SELECT
          gr.suggested_id AS profile_id,
          COUNT(DISTINCT gr.via_fan_id)::int AS connector_score,
          (
            SELECT mpfan.handle
            FROM graph_raw gr2
            INNER JOIN public.member_profiles mpfan ON mpfan.id = gr2.via_fan_id
            WHERE gr2.suggested_id = gr.suggested_id
            ORDER BY mpfan.handle ASC NULLS LAST
            LIMIT 1
          ) AS via_handle
        FROM graph_raw gr
        GROUP BY gr.suggested_id
      ),
      protocol_joined AS (
        SELECT
          oc.profile_id,
          oc.cid,
          COALESCE(NULLIF(trim(both from oc.cname_raw), ''), oc.cid) AS label
        FROM other_compounds oc
        INNER JOIN viewer_compounds vc ON vc.cid = oc.cid
      ),
      protocol_agg AS (
        SELECT
          pj.profile_id,
          COUNT(DISTINCT pj.cid)::int AS shared_compounds,
          coalesce(
            array_agg(DISTINCT pj.label ORDER BY pj.label) FILTER (WHERE pj.label IS NOT NULL AND pj.label <> ''),
            ARRAY[]::text[]
          ) AS shared_compound_names
        FROM protocol_joined pj
        GROUP BY pj.profile_id
      ),
      merged AS (
        SELECT
          COALESCE(g.profile_id, p.profile_id) AS profile_id,
          COALESCE(g.connector_score, 0)::int AS connector_score,
          COALESCE(p.shared_compounds, 0)::int AS shared_compounds,
          COALESCE(p.shared_compound_names, ARRAY[]::text[]) AS shared_compound_names,
          NULLIF(trim(both from COALESCE(g.via_handle, '')), '') AS via_handle,
          (2 * COALESCE(g.connector_score, 0) + 3 * COALESCE(p.shared_compounds, 0))::numeric AS relevance_score
        FROM graph_agg g
        FULL OUTER JOIN protocol_agg p ON g.profile_id = p.profile_id
        WHERE (2 * COALESCE(g.connector_score, 0) + 3 * COALESCE(p.shared_compounds, 0)) > 0
      )
      SELECT jsonb_agg(
        jsonb_build_object(
          'profile_id', sub.profile_id,
          'handle', sub.handle,
          'display_handle', sub.display_handle,
          'display_name', sub.display_name,
          'avatar_r2_key', sub.avatar_r2_key,
          'user_id', sub.user_id,
          'tier', sub.tier,
          'connector_score', sub.connector_score,
          'shared_compounds', sub.shared_compounds,
          'shared_compound_names', to_jsonb(sub.shared_compound_names),
          'via_handle', sub.via_handle,
          'relevance_score', sub.relevance_score
        )
        ORDER BY sub.relevance_score DESC, sub.handle_sort ASC NULLS LAST
      )
      FROM (
        SELECT
          m.profile_id,
          m.connector_score,
          m.shared_compounds,
          m.shared_compound_names,
          m.via_handle,
          m.relevance_score,
          mp.handle,
          mp.display_handle,
          mp.display_name,
          mp.avatar_r2_key,
          mp.user_id,
          pr.plan::text AS tier,
          mp.handle AS handle_sort
        FROM merged m
        INNER JOIN public.member_profiles mp ON mp.id = m.profile_id
        INNER JOIN public.profiles pr ON pr.id = mp.user_id
        ORDER BY m.relevance_score DESC, mp.handle ASC NULLS LAST
        LIMIT 20
      ) sub
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_suggested_profiles(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_suggested_profiles(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_suggested_profiles(uuid) IS
  'Authenticated: up to 20 suggested member_profiles for Find People — graph siblings (×2) + public stack compound overlap (×3); caller must own p_profile_id.';
