-- Optional deep-link targets for notification taps (likes/comments on stacks or dose posts).

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS target_share_id TEXT,
  ADD COLUMN IF NOT EXISTS target_network_post_id UUID;

COMMENT ON COLUMN public.notifications.target_share_id IS
  'Public stack share id for /stack/{id} when type is like/comment on a shared stack.';
COMMENT ON COLUMN public.notifications.target_network_post_id IS
  'network_feed row id (dose post) to scroll to on the Network tab when applicable.';
