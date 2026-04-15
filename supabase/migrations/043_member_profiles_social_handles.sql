-- Optional social usernames/handles (stored without full URLs; app constructs links on display).

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS tiktok_handle text,
  ADD COLUMN IF NOT EXISTS facebook_handle text,
  ADD COLUMN IF NOT EXISTS snapchat_handle text,
  ADD COLUMN IF NOT EXISTS linkedin_handle text,
  ADD COLUMN IF NOT EXISTS x_handle text,
  ADD COLUMN IF NOT EXISTS youtube_handle text,
  ADD COLUMN IF NOT EXISTS rumble_handle text;

COMMENT ON COLUMN public.member_profiles.instagram_handle IS 'Instagram username only (no URL); nullable.';
COMMENT ON COLUMN public.member_profiles.tiktok_handle IS 'TikTok username only (no @ prefix required); nullable.';
COMMENT ON COLUMN public.member_profiles.facebook_handle IS 'Facebook profile/username slug only; nullable.';
COMMENT ON COLUMN public.member_profiles.snapchat_handle IS 'Snapchat username for snapchat.com/add/…; nullable.';
COMMENT ON COLUMN public.member_profiles.linkedin_handle IS 'LinkedIn slug: in/username, company/slug, or plain username (defaults to /in/); nullable.';
COMMENT ON COLUMN public.member_profiles.x_handle IS 'X (Twitter) username only; nullable.';
COMMENT ON COLUMN public.member_profiles.youtube_handle IS 'YouTube @handle or channel id (UC…); nullable.';
COMMENT ON COLUMN public.member_profiles.rumble_handle IS 'Rumble channel slug (rumble.com/c/…) or c/slug or user/name; nullable.';
