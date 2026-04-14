-- In-app notifications (e.g. new follower). Recipient = profiles.id (auth user id).

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'new_follower',
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Denormalized from follower member_profiles at follow time (RLS hides other users’ profiles).
  actor_handle         TEXT,
  actor_display_handle TEXT,
  actor_display_name   TEXT NOT NULL DEFAULT ''
);

CREATE INDEX notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX notifications_user_unread_idx
  ON public.notifications (user_id)
  WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: select own"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications: update own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Authenticated clients may insert only when a matching follow row exists (trigger uses service role).
CREATE POLICY "notifications: insert as follower"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND user_id <> auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.member_follows mf
      INNER JOIN public.member_profiles mp_follower ON mp_follower.id = mf.follower_id
      INNER JOIN public.member_profiles mp_followee ON mp_followee.id = mf.following_id
      WHERE mp_follower.user_id = auth.uid()
        AND mp_followee.user_id = notifications.user_id
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

COMMENT ON TABLE public.notifications IS
  'User notifications; user_id is recipient (profiles.id). actor_id is the other account.';

CREATE OR REPLACE FUNCTION public.notify_new_follower_from_follow()
RETURNS TRIGGER
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
  SELECT mpf.user_id, mpf.handle, mpf.display_handle, mpf.display_name
    INTO follower_user, fh, fdh, fdname
  FROM public.member_profiles mpf
  WHERE mpf.id = NEW.follower_id;

  SELECT mpt.user_id
    INTO followee_user
  FROM public.member_profiles mpt
  WHERE mpt.id = NEW.following_id;

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
    actor_display_name
  )
  VALUES (
    followee_user,
    follower_user,
    'new_follower',
    false,
    fh,
    fdh,
    COALESCE(NULLIF(trim(fdname), ''), 'Member')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS member_follows_notify_followee ON public.member_follows;
CREATE TRIGGER member_follows_notify_followee
  AFTER INSERT ON public.member_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_follower_from_follow();
