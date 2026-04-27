-- Migration 074_likers_rpcs.sql
-- Already applied to production (project ref wrlobypvlqaraxnumwzg) on 2026-04-27.
-- This file is committed for repo source-of-truth so fresh-clone applies replay it.
--
-- Fixes Bug A: LikersModal showed 1 of N likers because PostgREST `!inner`
-- join semantics dropped any liker whose member_profiles row was hidden
-- by RLS (no own visible_network post → profile_has_visible_network_post
-- returned false → embed null → row dropped before the bare-select
-- fallback could fire).
--
-- FIX: Replace the inline join with two SECURITY DEFINER RPCs that bypass
-- member_profiles RLS while gating visibility on the parent post inside
-- the function body. Mirrors the pattern from get_network_feed (063, 073)
-- and profile_has_visible_network_post (068).

-- ============================================================
-- POST LIKERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_post_likers(p_post_id uuid)
RETURNS TABLE (
  like_id uuid,
  profile_id uuid,
  handle text,
  display_handle text,
  display_name text,
  avatar_r2_key text,
  liker_goal_emoji text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pl.id,
    pl.profile_id,
    mp.handle,
    mp.display_handle,
    mp.display_name,
    mp.avatar_r2_key,
    pl.liker_goal_emoji,
    pl.created_at
  FROM public.post_likes pl
  INNER JOIN public.member_profiles mp ON mp.id = pl.profile_id
  INNER JOIN public.posts p ON p.id = pl.post_id
  WHERE pl.post_id = p_post_id
    AND (
      p.visible_profile = true
      OR p.visible_network = true
      OR p.profile_id IN (
        SELECT id FROM public.member_profiles WHERE user_id = auth.uid()
      )
    )
  ORDER BY pl.created_at DESC
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.get_post_likers(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_post_likers(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.get_post_likers(uuid) IS
  'Returns likers of a post with display fields resolved, bypassing member_profiles RLS. Visibility gated on the parent post.';

-- ============================================================
-- COMMENT LIKERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_comment_likers(p_comment_id uuid)
RETURNS TABLE (
  like_id uuid,
  profile_id uuid,
  handle text,
  display_handle text,
  display_name text,
  avatar_r2_key text,
  liker_goal_emoji text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cl.id,
    cl.profile_id,
    mp.handle,
    mp.display_handle,
    mp.display_name,
    mp.avatar_r2_key,
    cl.liker_goal_emoji,
    cl.created_at
  FROM public.comment_likes cl
  INNER JOIN public.member_profiles mp ON mp.id = cl.profile_id
  INNER JOIN public.comments c ON c.id = cl.comment_id
  INNER JOIN public.posts p ON p.id = c.post_id
  WHERE cl.comment_id = p_comment_id
    AND (
      p.visible_profile = true
      OR p.visible_network = true
      OR p.profile_id IN (
        SELECT id FROM public.member_profiles WHERE user_id = auth.uid()
      )
    )
  ORDER BY cl.created_at DESC
  LIMIT 200;
$$;

REVOKE ALL ON FUNCTION public.get_comment_likers(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_comment_likers(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.get_comment_likers(uuid) IS
  'Returns likers of a comment with display fields resolved, bypassing member_profiles RLS. Visibility gated on the comment''s parent post.';

NOTIFY pgrst, 'reload schema';
