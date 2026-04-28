-- ============================================================
-- 078_get_network_vial_feed.sql
-- Phase 4 — Network feed RPC for shared vials + engagement hydration.
--
-- INNER JOIN public.posts (source_kind=vial, visible_network=true).
-- Only non-archived vials appear (archived rows lose posts via 077 trigger).
-- Idempotent: CREATE OR REPLACE FUNCTION.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_network_vial_feed()
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
          'post_id', sub.post_id,
          'like_count', sub.like_count,
          'comment_count', sub.comment_count,
          'handle', sub.handle,
          'display_name', sub.display_name,
          'tier', sub.tier,
          'pepguideiq_score', sub.pepguideiq_score,
          'updated_at', sub.updated_at,
          'avatar_r2_key', sub.avatar_r2_key,
          'user_id', sub.user_id,
          'vial_id', sub.vial_id,
          'peptide_id', sub.peptide_id,
          'label', sub.label,
          'vial_size_mg', sub.vial_size_mg,
          'bac_water_ml', sub.bac_water_ml,
          'concentration_mcg_ml', sub.concentration_mcg_ml,
          'notes', sub.notes_out,
          'share_notes_to_network', sub.share_notes_to_network,
          'vial_photo_r2_key', sub.vial_photo_r2_key,
          'status', sub.status,
          'reconstituted_at', sub.reconstituted_at
        )
        ORDER BY sub.sort_ts DESC NULLS LAST
      )
      FROM (
        SELECT
          posts.id AS post_id,
          posts.like_count AS like_count,
          posts.comment_count AS comment_count,
          COALESCE(NULLIF(trim(mp.display_handle), ''), mp.handle) AS handle,
          mp.display_name AS display_name,
          p_profile.plan::text AS tier,
          (
            COALESCE(
              (SELECT COUNT(*)::int FROM public.dose_logs dl WHERE dl.user_id = mp.user_id AND dl.profile_id = mp.id),
              0
            ) * 2
            + COALESCE(
              (SELECT COUNT(DISTINCT dl.peptide_id)::int FROM public.dose_logs dl WHERE dl.user_id = mp.user_id AND dl.profile_id = mp.id),
              0
            ) * 3
            + COALESCE(
              (SELECT COUNT(*)::int FROM public.user_vials uv2 WHERE uv2.user_id = mp.user_id AND uv2.profile_id = mp.id AND uv2.status = 'active' AND uv2.archived_at IS NULL),
              0
            ) * 1
            + COALESCE(
              (
                SELECT COUNT(DISTINCT ((dl.dosed_at AT TIME ZONE 'UTC')::date))::int
                FROM public.dose_logs dl
                WHERE dl.user_id = mp.user_id AND dl.profile_id = mp.id
              ),
              0
            ) * 1
          ) AS pepguideiq_score,
          posts.created_at AS updated_at,
          posts.created_at AS sort_ts,
          mp.avatar_r2_key AS avatar_r2_key,
          mp.user_id AS user_id,
          uv.id AS vial_id,
          uv.peptide_id AS peptide_id,
          uv.label AS label,
          uv.vial_size_mg AS vial_size_mg,
          uv.bac_water_ml AS bac_water_ml,
          uv.concentration_mcg_ml AS concentration_mcg_ml,
          CASE WHEN uv.share_notes_to_network THEN uv.notes ELSE NULL END AS notes_out,
          uv.share_notes_to_network AS share_notes_to_network,
          uv.vial_photo_r2_key AS vial_photo_r2_key,
          uv.status AS status,
          uv.reconstituted_at AS reconstituted_at
        FROM public.user_vials uv
        INNER JOIN public.member_profiles mp ON mp.id = uv.profile_id
        INNER JOIN public.profiles p_profile ON p_profile.id = mp.user_id
        INNER JOIN public.posts posts
          ON posts.source_kind = 'vial'
         AND posts.source_id = uv.id
         AND posts.visible_network = true
        WHERE uv.archived_at IS NULL
        ORDER BY posts.created_at DESC
        LIMIT 50
      ) sub
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_network_vial_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_network_vial_feed() TO authenticated;

COMMENT ON FUNCTION public.get_network_vial_feed() IS
  'Authenticated: network-visible shared vials (max 50) with posts mirror for engagement; SECURITY DEFINER.';

NOTIFY pgrst, 'reload schema';
