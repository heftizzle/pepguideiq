-- Add missing covering indexes on foreign key columns

CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id 
  ON public.comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_user_id 
  ON public.comments(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_target_post_id 
  ON public.notifications(target_post_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_user_id 
  ON public.post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_profile_id 
  ON public.shopping_lists(profile_id);

CREATE INDEX IF NOT EXISTS idx_support_requests_user_id 
  ON public.support_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_inbody_scan_history_user_id 
  ON public.inbody_scan_history(user_id);
