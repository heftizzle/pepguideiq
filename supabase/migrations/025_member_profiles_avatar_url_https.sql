-- Backfill member_profiles.avatar_url: store full Worker URL for R2 key-only values.
UPDATE public.member_profiles
SET avatar_url = 'https://pepguideiq-api-proxy.pepguideiq.workers.dev/avatars/' || avatar_url
WHERE avatar_url IS NOT NULL
  AND avatar_url NOT LIKE 'http%';
