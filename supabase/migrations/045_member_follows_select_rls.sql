-- Tighten member_follows SELECT RLS: only rows where the viewer is follower or followee
-- (replaces permissive USING (true) from 032_member_follows.sql).

DROP POLICY IF EXISTS "member_follows: select authenticated" ON public.member_follows;

CREATE POLICY "member_follows: select authenticated"
  ON public.member_follows FOR SELECT TO authenticated
  USING (
    follower_id IN (SELECT id FROM public.member_profiles WHERE user_id = auth.uid())
    OR following_id IN (SELECT id FROM public.member_profiles WHERE user_id = auth.uid())
  );
