-- Migration 065: posts table with media and visibility columns
-- Standalone member posts (image + caption) with network / public profile visibility.
-- R2 object key stored in media_url (no cache-bust query params).

CREATE TABLE IF NOT EXISTS public.posts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid        NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  content     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_url       text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_type      text    DEFAULT 'image';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS visible_network boolean NOT NULL DEFAULT true;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS visible_profile boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS posts_profile_id_created_at_idx
  ON public.posts (profile_id, created_at DESC);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts: insert own profile"      ON public.posts;
DROP POLICY IF EXISTS "posts: select own profile"      ON public.posts;
DROP POLICY IF EXISTS "posts: select visible_network"  ON public.posts;

-- Owner can insert their own posts
CREATE POLICY "posts: insert own profile"
  ON public.posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = posts.profile_id AND mp.user_id = auth.uid()
    )
  );

-- Owner can always read their own posts
CREATE POLICY "posts: select own profile"
  ON public.posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = posts.profile_id AND mp.user_id = auth.uid()
    )
  );

-- Any authenticated user can read posts shared to the network feed
CREATE POLICY "posts: select visible_network"
  ON public.posts FOR SELECT
  USING (visible_network = true);

GRANT SELECT, INSERT ON public.posts TO authenticated;
GRANT ALL             ON public.posts TO service_role;