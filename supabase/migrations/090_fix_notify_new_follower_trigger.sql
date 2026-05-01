-- Restore notification triggers broken by 089_notifications_target.sql (invalid actor_user_id /
-- follower_user_id columns). Re-merge 071 insert shape with target_type / target_id routing.

-- ── notify_new_follower_from_follow ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_new_follower_from_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  followee_user uuid;
  follower_user uuid;
  fh            text;
  fdh           text;
  fdname        text;
BEGIN
  SELECT mp.user_id, mp.handle, mp.display_handle, mp.display_name
    INTO follower_user, fh, fdh, fdname
  FROM public.member_profiles mp
  WHERE mp.id = NEW.follower_id;

  SELECT mp.user_id
    INTO followee_user
  FROM public.member_profiles mp
  WHERE mp.id = NEW.following_id;

  IF followee_user IS NULL OR follower_user IS NULL OR followee_user = follower_user THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    actor_id,
    type,
    read,
    actor_handle,
    actor_display_handle,
    actor_display_name,
    target_type,
    target_id,
    target_handle
  )
  VALUES (
    followee_user,
    follower_user,
    'follow',
    false,
    fh,
    fdh,
    COALESCE(NULLIF(trim(fdname), ''), fh, 'Member'),
    'profile',
    follower_user::text,
    fh
  );

  RETURN NEW;
END;
$$;

-- ── notify_on_post_like ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_post_like()
RETURNS trigger
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
  v_kind            text;
  v_source_id       uuid;
  v_share_id        text;
  v_target_type     text;
  v_target_id       text;
BEGIN
  SELECT mp.user_id, mp.handle
    INTO post_owner_user, post_owner_handle
  FROM public.posts p
  JOIN public.member_profiles mp ON mp.id = p.profile_id
  WHERE p.id = NEW.post_id;

  SELECT p.source_kind, p.source_id
    INTO v_kind, v_source_id
  FROM public.posts p
  WHERE p.id = NEW.post_id;

  SELECT mp.user_id, mp.handle, mp.display_handle, mp.display_name
    INTO liker_user, fh, fdh, fdname
  FROM public.member_profiles mp
  WHERE mp.id = NEW.profile_id;

  IF post_owner_user IS NULL OR liker_user IS NULL OR post_owner_user = liker_user THEN
    RETURN NEW;
  END IF;

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
    user_id,
    actor_id,
    type,
    read,
    target_post_id,
    target_handle,
    target_type,
    target_id,
    actor_handle,
    actor_display_handle,
    actor_display_name
  )
  VALUES (
    post_owner_user,
    liker_user,
    'post_like',
    false,
    NEW.post_id,
    post_owner_handle,
    v_target_type,
    v_target_id,
    fh,
    fdh,
    COALESCE(NULLIF(trim(fdname), ''), 'Member')
  );

  RETURN NEW;
END;
$$;

-- ── notify_on_comment ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_user    uuid;
  post_owner_handle text;
  commenter_user    uuid;
  notif_type        text;
  fh                text;
  fdh               text;
  fdname            text;
  v_kind            text;
  v_source_id       uuid;
  v_share_id        text;
  v_target_type     text;
  v_target_id       text;
BEGIN
  SELECT mp.handle
    INTO post_owner_handle
  FROM public.posts p
  JOIN public.member_profiles mp ON mp.id = p.profile_id
  WHERE p.id = NEW.post_id;

  SELECT p.source_kind, p.source_id
    INTO v_kind, v_source_id
  FROM public.posts p
  WHERE p.id = NEW.post_id;

  IF NEW.parent_comment_id IS NULL THEN
    SELECT mp.user_id
      INTO recipient_user
    FROM public.posts p
    JOIN public.member_profiles mp ON mp.id = p.profile_id
    WHERE p.id = NEW.post_id;
    notif_type := 'post_comment';
  ELSE
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
    user_id,
    actor_id,
    type,
    read,
    target_post_id,
    target_comment_id,
    target_handle,
    target_type,
    target_id,
    actor_handle,
    actor_display_handle,
    actor_display_name
  )
  VALUES (
    recipient_user,
    commenter_user,
    notif_type,
    false,
    NEW.post_id,
    NEW.id,
    post_owner_handle,
    v_target_type,
    v_target_id,
    fh,
    fdh,
    COALESCE(NULLIF(trim(fdname), ''), 'Member')
  );

  RETURN NEW;
END;
$$;

-- ── notify_on_comment_like ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  comment_owner_user uuid;
  post_owner_handle    text;
  liker_user           uuid;
  cpost_id             uuid;
  fh                   text;
  fdh                  text;
  fdname               text;
  v_kind               text;
  v_source_id          uuid;
  v_share_id           text;
  v_target_type        text;
  v_target_id          text;
BEGIN
  SELECT c.user_id, c.post_id
    INTO comment_owner_user, cpost_id
  FROM public.comments c
  WHERE c.id = NEW.comment_id;

  SELECT mp.handle
    INTO post_owner_handle
  FROM public.posts p
  JOIN public.member_profiles mp ON mp.id = p.profile_id
  WHERE p.id = cpost_id;

  SELECT p.source_kind, p.source_id
    INTO v_kind, v_source_id
  FROM public.posts p
  WHERE p.id = cpost_id;

  SELECT mp.user_id, mp.handle, mp.display_handle, mp.display_name
    INTO liker_user, fh, fdh, fdname
  FROM public.member_profiles mp
  WHERE mp.id = NEW.profile_id;

  IF comment_owner_user IS NULL OR liker_user IS NULL OR comment_owner_user = liker_user THEN
    RETURN NEW;
  END IF;

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
    user_id,
    actor_id,
    type,
    read,
    target_post_id,
    target_comment_id,
    target_handle,
    target_type,
    target_id,
    actor_handle,
    actor_display_handle,
    actor_display_name
  )
  VALUES (
    comment_owner_user,
    liker_user,
    'comment_like',
    false,
    cpost_id,
    NEW.comment_id,
    post_owner_handle,
    v_target_type,
    v_target_id,
    fh,
    fdh,
    COALESCE(NULLIF(trim(fdname), ''), 'Member')
  );

  RETURN NEW;
END;
$$;
