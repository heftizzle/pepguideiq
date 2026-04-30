-- 085: Fix auth.uid() re-evaluation — DROP + CREATE with correct policy bodies

-- profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- dose_logs (preserves profile_id membership check)
DROP POLICY IF EXISTS "Users own their dose logs" ON public.dose_logs;
CREATE POLICY "Users own their dose logs" ON public.dose_logs
  FOR ALL USING (
    (select auth.uid()) = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = dose_logs.profile_id AND mp.user_id = (select auth.uid()))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = dose_logs.profile_id AND mp.user_id = (select auth.uid()))
  );

-- user_vials (preserves profile_id membership check)
DROP POLICY IF EXISTS "Users own their vials" ON public.user_vials;
CREATE POLICY "Users own their vials" ON public.user_vials
  FOR ALL USING (
    (select auth.uid()) = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = user_vials.profile_id AND mp.user_id = (select auth.uid()))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = user_vials.profile_id AND mp.user_id = (select auth.uid()))
  );

-- query_log
DROP POLICY IF EXISTS "Users can view own query log" ON public.query_log;
CREATE POLICY "Users can view own query log" ON public.query_log
  FOR SELECT USING ((select auth.uid()) = user_id);

-- member_profiles
DROP POLICY IF EXISTS "member_profiles: select own" ON public.member_profiles;
CREATE POLICY "member_profiles: select own" ON public.member_profiles
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "member_profiles: update own" ON public.member_profiles;
CREATE POLICY "member_profiles: update own" ON public.member_profiles
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- user_stacks (preserves profile_id membership check)
DROP POLICY IF EXISTS "user_stacks: select own" ON public.user_stacks;
CREATE POLICY "user_stacks: select own" ON public.user_stacks
  FOR SELECT USING (
    (select auth.uid()) = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = user_stacks.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "user_stacks: insert own" ON public.user_stacks;
CREATE POLICY "user_stacks: insert own" ON public.user_stacks
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
    AND profile_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = user_stacks.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "user_stacks: update own" ON public.user_stacks;
CREATE POLICY "user_stacks: update own" ON public.user_stacks
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_stacks: delete own" ON public.user_stacks;
CREATE POLICY "user_stacks: delete own" ON public.user_stacks
  FOR DELETE USING ((select auth.uid()) = user_id);

-- network_feed (preserves post_type/inbody check on insert)
DROP POLICY IF EXISTS "network_feed: select own" ON public.network_feed;
CREATE POLICY "network_feed: select own" ON public.network_feed
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "network_feed: insert own" ON public.network_feed;
CREATE POLICY "network_feed: insert own" ON public.network_feed
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
    AND (
      (COALESCE(post_type, 'dose') = 'dose' AND dose_log_id IS NOT NULL)
      OR (post_type = 'inbody_progress' AND profile_id IS NOT NULL
          AND dose_log_id IS NULL
          AND EXISTS (SELECT 1 FROM member_profiles mp
            WHERE mp.id = network_feed.profile_id AND mp.user_id = (select auth.uid())))
    )
  );

DROP POLICY IF EXISTS "network_feed: update own" ON public.network_feed;
CREATE POLICY "network_feed: update own" ON public.network_feed
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- notifications (preserves follower relationship check on insert)
DROP POLICY IF EXISTS "notifications: select own" ON public.notifications;
CREATE POLICY "notifications: select own" ON public.notifications
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "notifications: update own" ON public.notifications;
CREATE POLICY "notifications: update own" ON public.notifications
  FOR UPDATE USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "notifications: insert as follower" ON public.notifications;
CREATE POLICY "notifications: insert as follower" ON public.notifications
  FOR INSERT WITH CHECK (
    actor_id = (select auth.uid())
    AND user_id <> (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM member_follows mf
      JOIN member_profiles mp_follower ON mp_follower.id = mf.follower_id
      JOIN member_profiles mp_followee ON mp_followee.id = mf.following_id
      WHERE mp_follower.user_id = (select auth.uid())
      AND mp_followee.user_id = notifications.user_id
    )
  );

-- member_fasts (uses member_profile_id, not user_id)
DROP POLICY IF EXISTS "member_fasts: select own profile" ON public.member_fasts;
CREATE POLICY "member_fasts: select own profile" ON public.member_fasts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = member_fasts.member_profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "member_fasts: insert own profile" ON public.member_fasts;
CREATE POLICY "member_fasts: insert own profile" ON public.member_fasts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = member_fasts.member_profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "member_fasts: update own profile" ON public.member_fasts;
CREATE POLICY "member_fasts: update own profile" ON public.member_fasts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = member_fasts.member_profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "member_fasts: delete own profile" ON public.member_fasts;
CREATE POLICY "member_fasts: delete own profile" ON public.member_fasts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = member_fasts.member_profile_id AND mp.user_id = (select auth.uid()))
  );

-- body_metrics (uses profile_id subquery)
DROP POLICY IF EXISTS "body_metrics: select scoped" ON public.body_metrics;
CREATE POLICY "body_metrics: select scoped" ON public.body_metrics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = body_metrics.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "body_metrics: insert scoped" ON public.body_metrics;
CREATE POLICY "body_metrics: insert scoped" ON public.body_metrics
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = body_metrics.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "body_metrics: update scoped" ON public.body_metrics;
CREATE POLICY "body_metrics: update scoped" ON public.body_metrics
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = body_metrics.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "body_metrics: delete scoped" ON public.body_metrics;
CREATE POLICY "body_metrics: delete scoped" ON public.body_metrics
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = body_metrics.profile_id AND mp.user_id = (select auth.uid()))
  );

-- inbody_scan_history (preserves profile_id membership check)
DROP POLICY IF EXISTS "inbody_scan_history: select scoped" ON public.inbody_scan_history;
CREATE POLICY "inbody_scan_history: select scoped" ON public.inbody_scan_history
  FOR SELECT USING (
    (select auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = inbody_scan_history.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "inbody_scan_history: insert scoped" ON public.inbody_scan_history;
CREATE POLICY "inbody_scan_history: insert scoped" ON public.inbody_scan_history
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = inbody_scan_history.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "inbody_scan_history: delete scoped" ON public.inbody_scan_history;
CREATE POLICY "inbody_scan_history: delete scoped" ON public.inbody_scan_history
  FOR DELETE USING (
    (select auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = inbody_scan_history.profile_id AND mp.user_id = (select auth.uid()))
  );

-- posts (uses profile_id subquery)
DROP POLICY IF EXISTS "posts: insert own profile" ON public.posts;
CREATE POLICY "posts: insert own profile" ON public.posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = posts.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "posts: select own profile" ON public.posts;
CREATE POLICY "posts: select own profile" ON public.posts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = posts.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "posts: delete own" ON public.posts;
CREATE POLICY "posts: delete own" ON public.posts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = posts.profile_id AND mp.user_id = (select auth.uid()))
  );

-- member_follows (uses follower_id subquery)
DROP POLICY IF EXISTS "member_follows: insert own" ON public.member_follows;
CREATE POLICY "member_follows: insert own" ON public.member_follows
  FOR INSERT WITH CHECK (
    follower_id IN (SELECT id FROM member_profiles WHERE user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "member_follows: delete own" ON public.member_follows;
CREATE POLICY "member_follows: delete own" ON public.member_follows
  FOR DELETE USING (
    follower_id IN (SELECT id FROM member_profiles WHERE user_id = (select auth.uid()))
  );

-- post_likes (preserves profile_id check on insert)
DROP POLICY IF EXISTS "post_likes: insert own" ON public.post_likes;
CREATE POLICY "post_likes: insert own" ON public.post_likes
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = post_likes.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "post_likes: delete own" ON public.post_likes;
CREATE POLICY "post_likes: delete own" ON public.post_likes
  FOR DELETE USING ((select auth.uid()) = user_id);

-- comment_likes (preserves profile_id check on insert)
DROP POLICY IF EXISTS "comment_likes: insert own" ON public.comment_likes;
CREATE POLICY "comment_likes: insert own" ON public.comment_likes
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = comment_likes.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "comment_likes: delete own" ON public.comment_likes;
CREATE POLICY "comment_likes: delete own" ON public.comment_likes
  FOR DELETE USING ((select auth.uid()) = user_id);

-- comments (preserves profile_id check on insert)
DROP POLICY IF EXISTS "comments: insert own" ON public.comments;
CREATE POLICY "comments: insert own" ON public.comments
  FOR INSERT WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (SELECT 1 FROM member_profiles mp
      WHERE mp.id = comments.profile_id AND mp.user_id = (select auth.uid()))
  );

DROP POLICY IF EXISTS "comments: delete own" ON public.comments;
CREATE POLICY "comments: delete own" ON public.comments
  FOR DELETE USING ((select auth.uid()) = user_id);

-- shopping_lists
DROP POLICY IF EXISTS "Users can read their own shopping lists" ON public.shopping_lists;
CREATE POLICY "Users can read their own shopping lists" ON public.shopping_lists
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own shopping lists" ON public.shopping_lists;
CREATE POLICY "Users can insert their own shopping lists" ON public.shopping_lists
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own shopping lists" ON public.shopping_lists;
CREATE POLICY "Users can delete their own shopping lists" ON public.shopping_lists
  FOR DELETE USING ((select auth.uid()) = user_id);

-- support_requests
DROP POLICY IF EXISTS "Users can create support requests" ON public.support_requests;
CREATE POLICY "Users can create support requests" ON public.support_requests
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own support requests" ON public.support_requests;
CREATE POLICY "Users can view own support requests" ON public.support_requests
  FOR SELECT USING ((select auth.uid()) = user_id);