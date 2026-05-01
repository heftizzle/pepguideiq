-- Add unified target columns to notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS target_type text DEFAULT NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS target_id text DEFAULT NULL;

CREATE INDEX IF NOT EXISTS notifications_target_idx
  ON public.notifications (target_type, target_id);

-- ── notify_new_follower_from_follow ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_new_follower_from_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id, actor_user_id, actor_handle, type,
    target_type, target_id
  )
  SELECT
    NEW.following_user_id,
    NEW.follower_user_id,
    mp.handle,
    'follow',
    'profile',
    NEW.follower_user_id::text
  FROM public.member_profiles mp
  WHERE mp.user_id = NEW.follower_user_id
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- ── notify_on_post_like ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_owner_id   uuid;
  v_actor_handle    text;
  v_post_id         uuid;
  v_kind            text;
  v_source_id       uuid;
  v_share_id        text;
  v_target_type     text;
  v_target_id       text;
BEGIN
  v_post_id := NEW.post_id;

  SELECT p.user_id, p.source_kind, p.source_id
    INTO v_post_owner_id, v_kind, v_source_id
  FROM public.posts p
  WHERE p.id = v_post_id;

  IF v_post_owner_id IS NULL OR v_post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT mp.handle INTO v_actor_handle
  FROM public.member_profiles mp
  WHERE mp.user_id = NEW.user_id;

  IF v_kind IN ('dose', 'inbody_progress') THEN
    v_target_type := 'dose_log';
    v_target_id   := v_source_id::text;
  ELSIF v_kind = 'vial' THEN
    v_target_type := 'vial_post';
    v_target_id   := v_source_id::text;
  ELSIF v_kind = 'stack' THEN
    SELECT us.share_id INTO v_share_id
    FROM public.user_stacks us
    WHERE us.id = v_source_id;
    v_target_type := 'stack';
    v_target_id   := v_share_id;
  ELSE
    v_target_type := NULL;
    v_target_id   := NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id, actor_user_id, actor_handle, type,
    target_post_id, target_handle,
    target_type, target_id
  )
  VALUES (
    v_post_owner_id, NEW.user_id, v_actor_handle, 'like',
    v_post_id, v_actor_handle,
    v_target_type, v_target_id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── notify_on_comment ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_owner_id   uuid;
  v_actor_handle    text;
  v_kind            text;
  v_source_id       uuid;
  v_share_id        text;
  v_target_type     text;
  v_target_id       text;
BEGIN
  SELECT p.user_id, p.source_kind, p.source_id
    INTO v_post_owner_id, v_kind, v_source_id
  FROM public.posts p
  WHERE p.id = NEW.post_id;

  IF v_post_owner_id IS NULL OR v_post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT mp.handle INTO v_actor_handle
  FROM public.member_profiles mp
  WHERE mp.user_id = NEW.user_id;

  IF v_kind IN ('dose', 'inbody_progress') THEN
    v_target_type := 'dose_log';
    v_target_id   := v_source_id::text;
  ELSIF v_kind = 'vial' THEN
    v_target_type := 'vial_post';
    v_target_id   := v_source_id::text;
  ELSIF v_kind = 'stack' THEN
    SELECT us.share_id INTO v_share_id
    FROM public.user_stacks us
    WHERE us.id = v_source_id;
    v_target_type := 'stack';
    v_target_id   := v_share_id;
  ELSE
    v_target_type := NULL;
    v_target_id   := NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id, actor_user_id, actor_handle, type,
    target_post_id, target_comment_id, target_handle,
    target_type, target_id
  )
  VALUES (
    v_post_owner_id, NEW.user_id, v_actor_handle, 'comment',
    NEW.post_id, NEW.id, v_actor_handle,
    v_target_type, v_target_id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── notify_on_comment_like ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comment_owner_id uuid;
  v_actor_handle     text;
  v_post_id          uuid;
  v_kind             text;
  v_source_id        uuid;
  v_share_id         text;
  v_target_type      text;
  v_target_id        text;
BEGIN
  SELECT c.user_id, c.post_id
    INTO v_comment_owner_id, v_post_id
  FROM public.comments c
  WHERE c.id = NEW.comment_id;

  IF v_comment_owner_id IS NULL OR v_comment_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT mp.handle INTO v_actor_handle
  FROM public.member_profiles mp
  WHERE mp.user_id = NEW.user_id;

  SELECT p.source_kind, p.source_id
    INTO v_kind, v_source_id
  FROM public.posts p
  WHERE p.id = v_post_id;

  IF v_kind IN ('dose', 'inbody_progress') THEN
    v_target_type := 'dose_log';
    v_target_id   := v_source_id::text;
  ELSIF v_kind = 'vial' THEN
    v_target_type := 'vial_post';
    v_target_id   := v_source_id::text;
  ELSIF v_kind = 'stack' THEN
    SELECT us.share_id INTO v_share_id
    FROM public.user_stacks us
    WHERE us.id = v_source_id;
    v_target_type := 'stack';
    v_target_id   := v_share_id;
  ELSE
    v_target_type := NULL;
    v_target_id   := NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id, actor_user_id, actor_handle, type,
    target_post_id, target_comment_id, target_handle,
    target_type, target_id
  )
  VALUES (
    v_comment_owner_id, NEW.user_id, v_actor_handle, 'comment_like',
    v_post_id, NEW.comment_id, v_actor_handle,
    v_target_type, v_target_id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
