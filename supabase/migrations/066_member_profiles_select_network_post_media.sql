-- Allow authenticated clients to read member_profiles rows for authors of
-- network-visible posts with media (PostgREST embed on `posts` feed).

DROP POLICY IF EXISTS "member_profiles: select for visible network post media" ON public.member_profiles;

CREATE POLICY "member_profiles: select for visible network post media"
  ON public.member_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.profile_id = member_profiles.id
        AND p.visible_network IS TRUE
        AND p.media_url IS NOT NULL
        AND length(trim(p.media_url)) > 0
    )
  );
