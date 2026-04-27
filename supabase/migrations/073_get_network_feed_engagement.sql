-- ============================================================
-- 073_get_network_feed_engagement.sql
-- Phase 3 of 4 — surface stack-share engagement in the Network feed.
--
-- Replaces public.get_network_feed() to INNER JOIN public.posts
-- (source_kind = 'stack', source_id = user_stacks.id) and return
-- post_id + like_count + comment_count per row. The 071 engagement
-- layer keys on posts.id; the client needs these fields for LikeButton
-- and CommentsSection.
--
-- INNER JOIN (not LEFT): every feed-visible stack should have a mirrored
-- posts row (072 backfill + set_stack_feed_visible). Defensive
-- posts.visible_network = true in the join keeps the feed fail-closed
-- if user_stacks.feed_visible and posts ever drift.
--
-- Idempotent: CREATE OR REPLACE FUNCTION.
-- ============================================================

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
          'user_id', sub.user_id,
          'post_id', sub.post_id,
          'like_count', sub.like_count,
          'comment_count', sub.comment_count
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
          p_profile.plan::text AS tier,
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
          mp.user_id AS user_id,
          posts.id AS post_id,
          posts.like_count AS like_count,
          posts.comment_count AS comment_count
        FROM public.user_stacks us
        INNER JOIN public.member_profiles mp ON mp.id = us.profile_id
        INNER JOIN public.profiles p_profile ON p_profile.id = mp.user_id
        INNER JOIN public.posts posts
          ON posts.source_kind = 'stack'
         AND posts.source_id = us.id
         AND posts.visible_network = true
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
  'Authenticated: network-visible stacks (max 50) with posts mirror for engagement; post_id, like_count, comment_count; INNER JOIN posts source_kind=stack; SECURITY DEFINER.';

-- ============================================================
-- ROLLBACK (manual — paste into psql if needed; NOT auto-run)
-- ============================================================
-- Source-of-truth for the prior body is 063_network_feed_avatar_user_in_feed_rpcs.sql
-- (get_network_feed without posts JOIN). Re-apply that function definition
-- from git history, or: restore from pg_get_functiondef captured before 073.
-- ============================================================
