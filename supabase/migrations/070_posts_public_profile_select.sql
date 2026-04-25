-- Migration 070: allow anon + authenticated to read posts the author marked
-- visible on their public profile. Network-only posts stay private.
--
-- Existing "posts: select own profile" (065) still covers the author seeing
-- their own private/network-only rows. Existing "posts: select visible_network"
-- (065) still covers the authenticated network feed.

DROP POLICY IF EXISTS "posts: select public profile" ON public.posts;

CREATE POLICY "posts: select public profile"
  ON public.posts FOR SELECT
  TO anon, authenticated
  USING (visible_profile = true);

GRANT SELECT ON public.posts TO anon;
