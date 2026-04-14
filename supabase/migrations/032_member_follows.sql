-- 032_member_follows.sql
-- Follow system: follower/following relationships between member_profiles

CREATE TABLE public.member_follows (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id    UUID NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  following_id   UUID NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT member_follows_no_self_follow CHECK (follower_id <> following_id),
  CONSTRAINT member_follows_unique UNIQUE (follower_id, following_id)
);

CREATE INDEX member_follows_follower_idx ON public.member_follows (follower_id);
CREATE INDEX member_follows_following_idx ON public.member_follows (following_id);

ALTER TABLE public.member_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_follows: select authenticated"
  ON public.member_follows FOR SELECT TO authenticated USING (true);

CREATE POLICY "member_follows: insert own"
  ON public.member_follows FOR INSERT TO authenticated
  WITH CHECK (
    follower_id IN (
      SELECT id FROM public.member_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "member_follows: delete own"
  ON public.member_follows FOR DELETE TO authenticated
  USING (
    follower_id IN (
      SELECT id FROM public.member_profiles WHERE user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.get_follow_counts(p_profile_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'following_count', (SELECT COUNT(*) FROM member_follows WHERE follower_id = p_profile_id),
    'follower_count',  (SELECT COUNT(*) FROM member_follows WHERE following_id = p_profile_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_follow_counts(UUID) TO authenticated;

COMMENT ON TABLE public.member_follows IS
  'Follow relationships between member_profiles. follower_id follows following_id.';
