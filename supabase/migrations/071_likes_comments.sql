-- ============================================================
-- 071_likes_comments.sql
-- Likes, comments, comment-likes: goal-emoji engagement primitives.
--
-- Ships the full Phase 1-3 schema in one migration so client rollouts
-- ship without further DB work:
--   Phase 1 UI: post likes only (post_likes + notify_on_post_like)
--   Phase 2 UI: comments (comments + comment_likes + their notify triggers)
--   Phase 3 UI: delete menu (posts: delete own + GRANT DELETE)
--
-- RLS pattern (critical): read policies use bare EXISTS through posts
-- with NO `AND p.visible_profile = true`. The EXISTS subquery inherits
-- posts RLS at execution time, so visibility cascades correctly:
--   - Anon visitors see likes/comments only on visible_profile posts
--   - Authenticated users see likes/comments on all posts they can SELECT
-- Do NOT add visibility predicates inside the EXISTS subqueries.
-- ============================================================

-- ---- Notification target columns -----------------------------
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS target_post_id    UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS target_comment_id UUID,
  ADD COLUMN IF NOT EXISTS target_handle     TEXT;

COMMENT ON COLUMN public.notifications.target_post_id    IS 'public.posts row for like/comment notifications.';
COMMENT ON COLUMN public.notifications.target_comment_id IS 'public.comments row for comment-like and reply notifications.';
COMMENT ON COLUMN public.notifications.target_handle     IS 'Denormalized member_profiles.handle of the post owner at insert time (drives /profile/:handle deep-link routing).';

-- ---- POST LIKES ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_likes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID NOT NULL REFERENCES public.posts(id)            ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id)              ON DELETE CASCADE,
  profile_id        UUID NOT NULL REFERENCES public.member_profiles(id)  ON DELETE CASCADE,
  liker_goal_emoji  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_post_likes_post    ON public.post_likes (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_profile ON public.post_likes (profile_id);

-- ---- COMMENTS (2-level nesting, immutable, hard-delete only) -
CREATE TABLE IF NOT EXISTS public.comments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id             UUID NOT NULL REFERENCES public.posts(id)            ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id)              ON DELETE CASCADE,
  profile_id          UUID NOT NULL REFERENCES public.member_profiles(id)  ON DELETE CASCADE,
  parent_comment_id   UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  body                TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  like_count          INT  NOT NULL DEFAULT 0,
  reply_count         INT  NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_post    ON public.comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent  ON public.comments (parent_comment_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_profile ON public.comments (profile_id);

CREATE OR REPLACE FUNCTION public.enforce_comment_depth()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.parent_comment_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.comments
      WHERE id = NEW.parent_comment_id AND parent_comment_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Comments can only nest 2 levels deep';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_comment_depth ON public.comments;
CREATE TRIGGER trg_enforce_comment_depth
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_comment_depth();

-- ---- COMMENT LIKES -------------------------------------------
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id        UUID NOT NULL REFERENCES public.comments(id)         ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id)              ON DELETE CASCADE,
  profile_id        UUID NOT NULL REFERENCES public.member_profiles(id)  ON DELETE CASCADE,
  liker_goal_emoji  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (comment_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes (comment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_likes_profile ON public.comment_likes (profile_id);

-- ---- DENORMALIZED COUNTS ON POSTS ----------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS like_count    INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INT NOT NULL DEFAULT 0;

-- ---- COUNT MAINTENANCE TRIGGERS ------------------------------
CREATE OR REPLACE FUNCTION public.sync_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS trg_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_like_count();

CREATE OR REPLACE FUNCTION public.sync_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS trg_comments_count ON public.comments;
CREATE TRIGGER trg_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_comment_count();

CREATE OR REPLACE FUNCTION public.sync_comment_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
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

DROP TRIGGER IF EXISTS trg_comment_likes_count ON public.comment_likes;
CREATE TRIGGER trg_comment_likes_count
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_comment_like_count();

-- ---- RLS POLICIES --------------------------------------------
-- READ  : cascading EXISTS through posts (inherits posts RLS — do NOT
--         add visibility predicates; see header comment).
-- INSERT: validates auth.uid() = user_id AND profile ownership.
-- DELETE: validates auth.uid() = user_id.

ALTER TABLE public.post_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- POST LIKES
DROP POLICY IF EXISTS "post_likes: select if post visible" ON public.post_likes;
CREATE POLICY "post_likes: select if post visible"
  ON public.post_likes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_likes.post_id));

DROP POLICY IF EXISTS "post_likes: insert own" ON public.post_likes;
CREATE POLICY "post_likes: insert own"
  ON public.post_likes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = post_likes.profile_id AND mp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "post_likes: delete own" ON public.post_likes;
CREATE POLICY "post_likes: delete own"
  ON public.post_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- COMMENTS (immutable — no UPDATE policy on purpose)
DROP POLICY IF EXISTS "comments: select if post visible" ON public.comments;
CREATE POLICY "comments: select if post visible"
  ON public.comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id));

DROP POLICY IF EXISTS "comments: insert own" ON public.comments;
CREATE POLICY "comments: insert own"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = comments.profile_id AND mp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comments: delete own" ON public.comments;
CREATE POLICY "comments: delete own"
  ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- COMMENT LIKES
DROP POLICY IF EXISTS "comment_likes: select if comment visible" ON public.comment_likes;
CREATE POLICY "comment_likes: select if comment visible"
  ON public.comment_likes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.comments c WHERE c.id = comment_likes.comment_id));

DROP POLICY IF EXISTS "comment_likes: insert own" ON public.comment_likes;
CREATE POLICY "comment_likes: insert own"
  ON public.comment_likes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = comment_likes.profile_id AND mp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comment_likes: delete own" ON public.comment_likes;
CREATE POLICY "comment_likes: delete own"
  ON public.comment_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.post_likes    TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.comments      TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT SELECT                 ON public.post_likes    TO anon;
GRANT SELECT                 ON public.comments      TO anon;
GRANT SELECT                 ON public.comment_likes TO anon;
GRANT ALL                    ON public.post_likes    TO service_role;
GRANT ALL                    ON public.comments      TO service_role;
GRANT ALL                    ON public.comment_likes TO service_role;

-- ---- NOTIFICATION TRIGGERS -----------------------------------
-- Pattern matches existing notify_new_follower_from_follow exactly:
-- SECURITY DEFINER, SET search_path = public,
-- COALESCE(NULLIF(trim(name),''),'Member') for display fallback.
-- target_handle is always the POST owner's member_profiles.handle (drives
-- /profile/:handle?post=…&comment=… deep-link routing). Recipient varies
-- (post owner for likes/top-level comments, parent-comment author for
-- replies, comment author for comment-likes), but the routing target stays
-- the post owner because that's where the post lives.

CREATE OR REPLACE FUNCTION public.notify_on_post_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_user   uuid;
  post_owner_handle text;
  liker_user        uuid;
  fh                text;
  fdh               text;
  fdname            text;
BEGIN
  SELECT mp.user_id, mp.handle
    INTO post_owner_user, post_owner_handle
  FROM public.posts p
  JOIN public.member_profiles mp ON mp.id = p.profile_id
  WHERE p.id = NEW.post_id;

  SELECT mp.user_id, mp.handle, mp.display_handle, mp.display_name
    INTO liker_user, fh, fdh, fdname
  FROM public.member_profiles mp
  WHERE mp.id = NEW.profile_id;

  IF post_owner_user IS NULL OR liker_user IS NULL OR post_owner_user = liker_user THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    user_id, actor_id, type, read,
    target_post_id, target_handle,
    actor_handle, actor_display_handle, actor_display_name
  )
  VALUES (
    post_owner_user, liker_user, 'post_like', false,
    NEW.post_id, post_owner_handle,
    fh, fdh, COALESCE(NULLIF(trim(fdname), ''), 'Member')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS post_likes_notify_owner ON public.post_likes;
CREATE TRIGGER post_likes_notify_owner
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_post_like();

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_user     uuid;
  post_owner_handle    text;
  commenter_user       uuid;
  notif_type           text;
  fh                   text;
  fdh                  text;
  fdname               text;
BEGIN
  -- target_handle is ALWAYS the post owner's handle (where the post lives,
  -- drives /profile/:handle?post=… routing regardless of recipient).
  SELECT mp.handle
    INTO post_owner_handle
  FROM public.posts p
  JOIN public.member_profiles mp ON mp.id = p.profile_id
  WHERE p.id = NEW.post_id;

  IF NEW.parent_comment_id IS NULL THEN
    -- Top-level comment → notify post owner
    SELECT mp.user_id
      INTO recipient_user
    FROM public.posts p
    JOIN public.member_profiles mp ON mp.id = p.profile_id
    WHERE p.id = NEW.post_id;
    notif_type := 'post_comment';
  ELSE
    -- Reply → notify PARENT comment author (but route to post owner's profile)
    SELECT user_id
      INTO recipient_user
    FROM public.comments
    WHERE id = NEW.parent_comment_id;
    notif_type := 'comment_reply';
  END IF;

  SELECT mp.user_id, mp.handle, mp.display_handle, mp.display_name
    INTO commenter_user, fh, fdh, fdname
  FROM public.member_profiles mp
  WHERE mp.id = NEW.profile_id;

  IF recipient_user IS NULL OR commenter_user IS NULL OR recipient_user = commenter_user THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    user_id, actor_id, type, read,
    target_post_id, target_comment_id, target_handle,
    actor_handle, actor_display_handle, actor_display_name
  )
  VALUES (
    recipient_user, commenter_user, notif_type, false,
    NEW.post_id, NEW.id, post_owner_handle,
    fh, fdh, COALESCE(NULLIF(trim(fdname), ''), 'Member')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comments_notify_recipient ON public.comments;
CREATE TRIGGER comments_notify_recipient
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

CREATE OR REPLACE FUNCTION public.notify_on_comment_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comment_owner_user  uuid;
  post_owner_handle     text;
  liker_user            uuid;
  cpost_id              uuid;
  fh                    text;
  fdh                   text;
  fdname                text;
BEGIN
  -- Get the comment author (recipient) and which post it's on
  SELECT c.user_id, c.post_id
    INTO comment_owner_user, cpost_id
  FROM public.comments c
  WHERE c.id = NEW.comment_id;

  -- target_handle is the POST owner's handle (drives /profile/:handle routing)
  SELECT mp.handle
    INTO post_owner_handle
  FROM public.posts p
  JOIN public.member_profiles mp ON mp.id = p.profile_id
  WHERE p.id = cpost_id;

  SELECT mp.user_id, mp.handle, mp.display_handle, mp.display_name
    INTO liker_user, fh, fdh, fdname
  FROM public.member_profiles mp
  WHERE mp.id = NEW.profile_id;

  IF comment_owner_user IS NULL OR liker_user IS NULL OR comment_owner_user = liker_user THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    user_id, actor_id, type, read,
    target_post_id, target_comment_id, target_handle,
    actor_handle, actor_display_handle, actor_display_name
  )
  VALUES (
    comment_owner_user, liker_user, 'comment_like', false,
    cpost_id, NEW.comment_id, post_owner_handle,
    fh, fdh, COALESCE(NULLIF(trim(fdname), ''), 'Member')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comment_likes_notify_owner ON public.comment_likes;
CREATE TRIGGER comment_likes_notify_owner
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment_like();

-- ---- POSTS: owner can delete (Phase 3 PostMenuButton) --------
-- Dormant for Phase 1 (no UI calls DELETE yet), but the policy + grant
-- land now so Phase 3 is pure client work.

DROP POLICY IF EXISTS "posts: delete own" ON public.posts;
CREATE POLICY "posts: delete own"
  ON public.posts FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = posts.profile_id AND mp.user_id = auth.uid()
    )
  );
GRANT DELETE ON public.posts TO authenticated;

-- ============================================================
-- ROLLBACK (manual — paste into psql if needed; NOT auto-run)
-- ============================================================
-- DROP TRIGGER IF EXISTS post_likes_notify_owner       ON public.post_likes;
-- DROP TRIGGER IF EXISTS comments_notify_recipient     ON public.comments;
-- DROP TRIGGER IF EXISTS comment_likes_notify_owner    ON public.comment_likes;
-- DROP TRIGGER IF EXISTS trg_post_likes_count          ON public.post_likes;
-- DROP TRIGGER IF EXISTS trg_comments_count            ON public.comments;
-- DROP TRIGGER IF EXISTS trg_comment_likes_count       ON public.comment_likes;
-- DROP TRIGGER IF EXISTS trg_enforce_comment_depth     ON public.comments;
--
-- DROP FUNCTION IF EXISTS public.notify_on_post_like()     CASCADE;
-- DROP FUNCTION IF EXISTS public.notify_on_comment()       CASCADE;
-- DROP FUNCTION IF EXISTS public.notify_on_comment_like()  CASCADE;
-- DROP FUNCTION IF EXISTS public.sync_post_like_count()    CASCADE;
-- DROP FUNCTION IF EXISTS public.sync_post_comment_count() CASCADE;
-- DROP FUNCTION IF EXISTS public.sync_comment_like_count() CASCADE;
-- DROP FUNCTION IF EXISTS public.enforce_comment_depth()   CASCADE;
--
-- DROP TABLE IF EXISTS public.comment_likes CASCADE;
-- DROP TABLE IF EXISTS public.comments      CASCADE;
-- DROP TABLE IF EXISTS public.post_likes    CASCADE;
--
-- ALTER TABLE public.posts
--   DROP COLUMN IF EXISTS like_count,
--   DROP COLUMN IF EXISTS comment_count;
--
-- ALTER TABLE public.notifications
--   DROP COLUMN IF EXISTS target_post_id,
--   DROP COLUMN IF EXISTS target_comment_id,
--   DROP COLUMN IF EXISTS target_handle;
--
-- DROP POLICY IF EXISTS "posts: delete own" ON public.posts;
-- REVOKE DELETE ON public.posts FROM authenticated;
-- ============================================================
