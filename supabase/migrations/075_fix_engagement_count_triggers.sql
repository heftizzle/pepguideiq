-- Migration 075_fix_engagement_count_triggers.sql
-- Already applied to production (project ref wrlobypvlqaraxnumwzg) on 2026-04-27.
-- This file is committed for repo source-of-truth so fresh-clone applies replay it.
--
-- Fixes Bug B: posts.like_count / posts.comment_count / comments.like_count
-- / comments.reply_count denorms stuck at 0 despite real engagement rows.
--
-- ROOT CAUSE: The sync_* trigger functions from 071 lack SECURITY DEFINER.
-- They run in the inserting user's auth context. posts and comments have
-- RLS enabled but NO UPDATE policy. So the trigger's `UPDATE posts SET
-- like_count = like_count + 1` is silently filtered by RLS to 0 rows
-- affected. No error raised, INSERT commits, denorm stays at 0.
--
-- Compare to the notify_* functions in 071, which DO have SECURITY DEFINER
-- and write to public.notifications successfully. Same trigger pattern,
-- different security context — that asymmetry is the bug.
--
-- FIX:
-- 1. Recreate the three sync functions with SECURITY DEFINER + locked
--    search_path. Safe to elevate: inputs are typed UUIDs from NEW.*/OLD.*,
--    no injection surface, parent INSERT/DELETE policies on post_likes /
--    comment_likes / comments still enforce auth before the trigger fires.
-- 2. Backfill all four denorm columns from actual row counts.

-- ============================================================
-- 1. RECREATE SYNC FUNCTIONS WITH SECURITY DEFINER
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_comment_id IS NULL THEN
      UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSE
      UPDATE public.comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.parent_comment_id IS NULL THEN
      UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    ELSE
      UPDATE public.comments SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_comment_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.sync_post_like_count() IS
  'SECURITY DEFINER: trigger needs to UPDATE posts despite no UPDATE RLS policy. Safe — input is typed NEW/OLD uuid; parent INSERT/DELETE policies enforce auth.';
COMMENT ON FUNCTION public.sync_post_comment_count() IS
  'SECURITY DEFINER: trigger needs to UPDATE posts/comments despite no UPDATE RLS policy. Safe — input is typed NEW/OLD uuid; parent INSERT/DELETE policies enforce auth.';
COMMENT ON FUNCTION public.sync_comment_like_count() IS
  'SECURITY DEFINER: trigger needs to UPDATE comments despite no UPDATE RLS policy. Safe — input is typed NEW/OLD uuid; parent INSERT/DELETE policies enforce auth.';

-- ============================================================
-- 2. BACKFILL ALL FOUR DENORM COLUMNS FROM ACTUAL COUNTS
-- ============================================================

UPDATE public.posts p
SET like_count = COALESCE(lc.actual, 0)
FROM (
  SELECT post_id, count(*)::int AS actual
  FROM public.post_likes
  GROUP BY post_id
) lc
WHERE lc.post_id = p.id
  AND p.like_count <> COALESCE(lc.actual, 0);

UPDATE public.posts p
SET like_count = 0
WHERE p.like_count > 0
  AND NOT EXISTS (SELECT 1 FROM public.post_likes pl WHERE pl.post_id = p.id);

UPDATE public.posts p
SET comment_count = COALESCE(cc.actual, 0)
FROM (
  SELECT post_id, count(*)::int AS actual
  FROM public.comments
  WHERE parent_comment_id IS NULL
  GROUP BY post_id
) cc
WHERE cc.post_id = p.id
  AND p.comment_count <> COALESCE(cc.actual, 0);

UPDATE public.posts p
SET comment_count = 0
WHERE p.comment_count > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.comments c
    WHERE c.post_id = p.id AND c.parent_comment_id IS NULL
  );

UPDATE public.comments c
SET like_count = COALESCE(cl.actual, 0)
FROM (
  SELECT comment_id, count(*)::int AS actual
  FROM public.comment_likes
  GROUP BY comment_id
) cl
WHERE cl.comment_id = c.id
  AND c.like_count <> COALESCE(cl.actual, 0);

UPDATE public.comments c
SET like_count = 0
WHERE c.like_count > 0
  AND NOT EXISTS (SELECT 1 FROM public.comment_likes cl WHERE cl.comment_id = c.id);

UPDATE public.comments c
SET reply_count = COALESCE(rc.actual, 0)
FROM (
  SELECT parent_comment_id, count(*)::int AS actual
  FROM public.comments
  WHERE parent_comment_id IS NOT NULL
  GROUP BY parent_comment_id
) rc
WHERE rc.parent_comment_id = c.id
  AND c.reply_count <> COALESCE(rc.actual, 0);

UPDATE public.comments c
SET reply_count = 0
WHERE c.reply_count > 0
  AND NOT EXISTS (SELECT 1 FROM public.comments r WHERE r.parent_comment_id = c.id);

NOTIFY pgrst, 'reload schema';
