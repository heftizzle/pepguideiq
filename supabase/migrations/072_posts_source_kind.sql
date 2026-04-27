-- ============================================================
-- 072_posts_source_kind.sql
-- Polymorphic post sources (Phase 1 of 4).
--
-- Every shareable entity (stack today; vial in 073; future dose log,
-- reel) materializes as a row in public.posts with source_kind +
-- source_id. The engagement layer (post_likes, comments, comment_likes,
-- notifications) from 071 is unchanged and still keys on posts.id.
--
-- Phase 1 = pure DB. No JSX/hook/lib edits. user-visible behavior is
-- identical: today's "Post to Network" toggle still writes to
-- user_stacks.feed_visible via updateStack(); posts.visible_network is
-- backfilled but not yet read by any consumer. Phase 2 wires the JSX
-- to call set_stack_feed_visible() and the network feed to hydrate
-- through posts.source_*.
--
-- Verified against 071: zero triggers fire on public.posts INSERT
-- (071's notify_* triggers fire on post_likes / comments /
-- comment_likes only). Backfill therefore has no notification side
-- effects.
-- ============================================================

-- 1. Enum. 'media' is existing posts; 'stack' is new. 'vial' added in 073.
--    Idempotent: PG <15 has no CREATE TYPE IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'post_source_kind'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.post_source_kind AS ENUM ('media', 'stack');
  END IF;
END $$;

-- 2. Columns. Default 'media' so existing rows backfill correctly.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS source_kind public.post_source_kind NOT NULL DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS source_id   uuid;

-- 3. Consistency CHECK: source_id required iff source_kind != 'media'.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.posts'::regclass
      AND conname  = 'posts_source_consistency'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_source_consistency
      CHECK (
        (source_kind = 'media' AND source_id IS NULL)
        OR (source_kind <> 'media' AND source_id IS NOT NULL)
      );
  END IF;
END $$;

-- 4. Uniqueness: one post per (profile, source). Re-share is idempotent.
CREATE UNIQUE INDEX IF NOT EXISTS posts_one_per_source_idx
  ON public.posts (profile_id, source_kind, source_id)
  WHERE source_kind <> 'media';

-- 5. Hydration index.
CREATE INDEX IF NOT EXISTS posts_source_idx
  ON public.posts (source_kind, source_id)
  WHERE source_kind <> 'media';

-- 6. Cleanup trigger: stack delete removes its post; 071 FKs cascade engagement.
CREATE OR REPLACE FUNCTION public.cleanup_post_on_stack_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.posts
   WHERE source_kind = 'stack' AND source_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_post_on_stack_delete ON public.user_stacks;
CREATE TRIGGER trg_cleanup_post_on_stack_delete
  AFTER DELETE ON public.user_stacks
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_post_on_stack_delete();

-- 7. RPC: atomic toggle of stack feed visibility. Phase 2 calls this from JSX.
CREATE OR REPLACE FUNCTION public.set_stack_feed_visible(
  p_stack_id uuid,
  p_visible  boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_user_id    uuid;
BEGIN
  SELECT profile_id, user_id
    INTO v_profile_id, v_user_id
    FROM public.user_stacks
   WHERE id = p_stack_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'stack not found' USING errcode = 'P0002';
  END IF;

  IF v_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not authorized' USING errcode = '42501';
  END IF;

  UPDATE public.user_stacks
     SET feed_visible = p_visible
   WHERE id = p_stack_id;

  INSERT INTO public.posts
    (profile_id, source_kind, source_id, visible_network, visible_profile)
  VALUES
    (v_profile_id, 'stack', p_stack_id, p_visible, false)
  ON CONFLICT (profile_id, source_kind, source_id)
    WHERE source_kind <> 'media'
  DO UPDATE SET visible_network = EXCLUDED.visible_network;
END;
$$;

REVOKE ALL  ON FUNCTION public.set_stack_feed_visible(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_stack_feed_visible(uuid, boolean) TO authenticated;

-- 8. Backfill. Idempotent via ON CONFLICT against posts_one_per_source_idx.
INSERT INTO public.posts
  (profile_id, content, source_kind, source_id, visible_network, visible_profile, created_at)
SELECT
  us.profile_id,
  NULL,
  'stack'::public.post_source_kind,
  us.id,
  true,
  false,
  COALESCE(us.updated_at, NOW())
FROM public.user_stacks us
WHERE us.feed_visible = true
  AND us.profile_id IS NOT NULL
ON CONFLICT (profile_id, source_kind, source_id)
  WHERE source_kind <> 'media'
DO NOTHING;

-- ============================================================
-- ROLLBACK (manual — paste into psql if needed; NOT auto-run)
-- ============================================================
-- DROP TRIGGER  IF EXISTS trg_cleanup_post_on_stack_delete ON public.user_stacks;
-- DROP FUNCTION IF EXISTS public.cleanup_post_on_stack_delete()        CASCADE;
-- DROP FUNCTION IF EXISTS public.set_stack_feed_visible(uuid, boolean) CASCADE;
-- DROP INDEX    IF EXISTS public.posts_source_idx;
-- DROP INDEX    IF EXISTS public.posts_one_per_source_idx;
-- ALTER TABLE   public.posts DROP CONSTRAINT IF EXISTS posts_source_consistency;
-- ALTER TABLE   public.posts DROP COLUMN IF EXISTS source_id;
-- ALTER TABLE   public.posts DROP COLUMN IF EXISTS source_kind;
-- DROP TYPE     IF EXISTS public.post_source_kind;
-- Delete backfilled stack posts before re-applying:
--   DELETE FROM public.posts WHERE source_kind = 'stack';
-- ============================================================
