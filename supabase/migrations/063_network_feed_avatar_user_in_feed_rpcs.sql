-- Surface member avatar R2 key + user id on network feed RPCs (Network tab avatars).

CREATE OR REPLACE FUNCTION public.get_public_network_dose_feed()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(u.row_obj ORDER BY u.sort_at DESC)
      FROM (
        SELECT *
        FROM (
          -- DOSE path
          SELECT
            nf.created_at AS sort_at,
            jsonb_build_object(
              'id', nf.id,
              'post_type', COALESCE(nf.post_type, 'dose'),
              'created_at', nf.created_at,
              'expires_at', nf.expires_at,
              'compound_id', nf.compound_id,
              'dose_amount', nf.dose_amount,
              'dose_unit', nf.dose_unit,
              'route', nf.route,
              'session_label', nf.session_label,
              'handle', mp.handle,
              'display_handle', mp.display_handle,
              'verified_credential', p.verified_credential,
              'display_name', mp.display_name,
              'avatar_r2_key', mp.avatar_r2_key,
              'user_id', nf.user_id,
              'stack_label',
              CASE
                WHEN nf.stack_id IS NULL THEN NULL
                ELSE COALESCE(
                  NULLIF(trim((us.stack -> 0 ->> 'name')), ''),
                  'Saved stack'
                )
              END
            ) AS row_obj
          FROM public.network_feed nf
          LEFT JOIN public.profiles p ON p.id = nf.user_id
          LEFT JOIN LATERAL (
            SELECT
              mp1.handle,
              mp1.display_handle,
              mp1.display_name,
              mp1.avatar_r2_key
            FROM public.member_profiles mp1
            WHERE mp1.user_id = nf.user_id
            ORDER BY mp1.is_default DESC NULLS LAST,
              mp1.created_at ASC NULLS LAST
            LIMIT 1
          ) mp ON TRUE
          LEFT JOIN public.user_stacks us ON us.id = nf.stack_id
          WHERE nf.expires_at > timezone('utc', now())
            AND nf.public_visible = true
            AND COALESCE(nf.post_type, 'dose') = 'dose'

          UNION ALL

          -- INBODY path
          SELECT
            nf.created_at AS sort_at,
            jsonb_build_object(
              'id', nf.id,
              'post_type', 'inbody_progress',
              'created_at', nf.created_at,
              'expires_at', nf.expires_at,
              'handle', mp.handle,
              'display_handle', mp.display_handle,
              'verified_credential', p.verified_credential,
              'display_name', mp.display_name,
              'avatar_r2_key', mp.avatar_r2_key,
              'user_id', nf.user_id,
              'content_json', nf.content_json
            ) AS row_obj
          FROM public.network_feed nf
          INNER JOIN public.member_profiles mp ON mp.id = nf.profile_id
          INNER JOIN public.profiles p ON p.id = nf.user_id
          WHERE nf.expires_at > timezone('utc', now())
            AND nf.public_visible = true
            AND nf.post_type = 'inbody_progress'
        ) combined
        ORDER BY combined.sort_at DESC
        LIMIT 50
      ) u
    ),
    '[]'::jsonb
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_network_dose_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_network_dose_feed() TO authenticated;

COMMENT ON FUNCTION public.get_public_network_dose_feed() IS
  'Authenticated: active public_visible dose + InBody progress posts (max 50, newest first); includes avatar_r2_key + user_id; SECURITY DEFINER.';


CREATE OR REPLACE FUNCTION public.get_network_feed()
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
          'updated_at', sub.updated_at,
          'avatar_r2_key', sub.avatar_r2_key,
          'user_id', sub.user_id
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
          us.updated_at AS updated_at,
          mp.avatar_r2_key AS avatar_r2_key,
          mp.user_id AS user_id
        FROM public.user_stacks us
        INNER JOIN public.member_profiles mp ON mp.id = us.profile_id
        INNER JOIN public.profiles p ON p.id = mp.user_id
        WHERE us.feed_visible = true
          AND us.share_id IS NOT NULL
          AND btrim(us.share_id) <> ''
        ORDER BY us.updated_at DESC
        LIMIT 50
      ) sub
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_network_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_network_feed() TO authenticated;

COMMENT ON FUNCTION public.get_network_feed() IS
  'Authenticated: network-visible stacks (max 50); stack_name from share_id; display_handle when set; pepguideIQ score; updated_at; avatar_r2_key; user_id.';
