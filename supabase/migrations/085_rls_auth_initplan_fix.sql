-- 085: Fix auth.uid() re-evaluation — DROP + CREATE approach

-- profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- dose_logs
DROP POLICY IF EXISTS "Users own their dose logs" ON public.dose_logs;
CREATE POLICY "Users own their dose logs" ON public.dose_logs
  FOR ALL USING ((select auth.uid()) = user_id);

-- user_vials
DROP POLICY IF EXISTS "Users own their vials" ON public.user_vials;
CREATE POLICY "Users own their vials" ON public.user_vials
  FOR ALL USING ((select auth.uid()) = user_id);

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
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- user_stacks
DROP POLICY IF EXISTS "user_stacks: select own" ON public.user_stacks;
CREATE POLICY "user_stacks: select own" ON public.user_stacks
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_stacks: insert own" ON public.user_stacks;
CREATE POLICY "user_stacks: insert own" ON public.user_stacks
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_stacks: update own" ON public.user_stacks;
CREATE POLICY "user_stacks: update own" ON public.user_stacks
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "user_stacks: delete own" ON public.user_stacks;
CREATE POLICY "user_stacks: delete own" ON public.user_stacks
  FOR DELETE USING ((select auth.uid()) = user_id);

-- network_feed
DROP POLICY IF EXISTS "network_feed: select own" ON public.network_feed;
CREATE POLICY "network_feed: select own" ON public.network_feed
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "network_feed: insert own" ON public.network_feed;
CREATE POLICY "network_feed: insert own" ON public.network_feed
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "network_feed: update own" ON public.network_feed;
CREATE POLICY "network_feed: update own" ON public.network_feed
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- notifications
DROP POLICY IF EXISTS "notifications: select own" ON public.notifications;
CREATE POLICY "notifications: select own" ON public.notifications
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notifications: update own" ON public.notifications;
CREATE POLICY "notifications: update own" ON public.notifications
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notifications: insert as follower" ON public.notifications;
CREATE POLICY "notifications: insert as follower" ON public.notifications
  FOR INSERT WITH CHECK ((select auth.uid()) = actor_id);

-- member_fasts
DROP POLICY IF EXISTS "member_fasts: select own profile" ON public.member_fasts;
CREATE POLICY "member_fasts: select own profile" ON public.member_fasts
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "member_fasts: insert own profile" ON public.member_fasts;
CREATE POLICY "member_fasts: insert own profile" ON public.member_fasts
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "member_fasts: update own profile" ON public.member_fasts;
CREATE POLICY "member_fasts: update own profile" ON public.member_fasts
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "member_fasts: delete own profile" ON public.member_fasts;
CREATE POLICY "member_fasts: delete own profile" ON public.member_fasts
  FOR DELETE USING ((select auth.uid()) = user_id);

-- body_metrics
DROP POLICY IF EXISTS "body_metrics: select scoped" ON public.body_metrics;
CREATE POLICY "body_metrics: select scoped" ON public.body_metrics
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "body_metrics: insert scoped" ON public.body_metrics;
CREATE POLICY "body_metrics: insert scoped" ON public.body_metrics
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "body_metrics: update scoped" ON public.body_metrics;
CREATE POLICY "body_metrics: update scoped" ON public.body_metrics
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "body_metrics: delete scoped" ON public.body_metrics;
CREATE POLICY "body_metrics: delete scoped" ON public.body_metrics
  FOR DELETE USING ((select auth.uid()) = user_id);

-- inbody_scan_history
DROP POLICY IF EXISTS "inbody_scan_history: select scoped" ON public.inbody_scan_history;
CREATE POLICY "inbody_scan_history: select scoped" ON public.inbody_scan_history
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "inbody_scan_history: insert scoped" ON public.inbody_scan_history;
CREATE POLICY "inbody_scan_history: insert scoped" ON public.inbody_scan_history
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "inbody_scan_history: delete scoped" ON public.inbody_scan_history;
CREATE POLICY "inbody_scan_history: delete scoped" ON public.inbody_scan_history
  FOR DELETE USING ((select auth.uid()) = user_id);

-- posts
DROP POLICY IF EXISTS "posts: insert own profile" ON public.posts;
CREATE POLICY "posts: insert own profile" ON public.posts
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "posts: select own profile" ON public.posts;
CREATE POLICY "posts: select own profile" ON public.posts
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "posts: delete own" ON public.posts;
CREATE POLICY "posts: delete own" ON public.posts
  FOR DELETE USING ((select auth.uid()) = user_id);

-- member_follows
DROP POLICY IF EXISTS "member_follows: insert own" ON public.member_follows;
CREATE POLICY "member_follows: insert own" ON public.member_follows
  FOR INSERT WITH CHECK ((select auth.uid()) = follower_user_id);

DROP POLICY IF EXISTS "member_follows: delete own" ON public.member_follows;
CREATE POLICY "member_follows: delete own" ON public.member_follows
  FOR DELETE USING ((select auth.uid()) = follower_user_id);

-- post_likes
DROP POLICY IF EXISTS "post_likes: insert own" ON public.post_likes;
CREATE POLICY "post_likes: insert own" ON public.post_likes
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "post_likes: delete own" ON public.post_likes;
CREATE POLICY "post_likes: delete own" ON public.post_likes
  FOR DELETE USING ((select auth.uid()) = user_id);

-- comment_likes
DROP POLICY IF EXISTS "comment_likes: insert own" ON public.comment_likes;
CREATE POLICY "comment_likes: insert own" ON public.comment_likes
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "comment_likes: delete own" ON public.comment_likes;
CREATE POLICY "comment_likes: delete own" ON public.comment_likes
  FOR DELETE USING ((select auth.uid()) = user_id);

-- comments
DROP POLICY IF EXISTS "comments: insert own" ON public.comments;
CREATE POLICY "comments: insert own" ON public.comments
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

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
