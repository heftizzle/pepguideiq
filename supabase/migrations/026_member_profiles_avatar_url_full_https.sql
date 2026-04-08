-- Idempotent backfill: every member_profiles.avatar_url must be a full https URL.
-- Handles three legacy variants left over from the R2 pipeline rework:
--   1) bare R2 key  ->  https://pepguideiq-api-proxy.pepguideiq.workers.dev/avatars/<key>
--   2) "/avatars/<key>" path  ->  https://pepguideiq-api-proxy.pepguideiq.workers.dev/avatars/<key>
--   3) "avatars/<key>" path   ->  https://pepguideiq-api-proxy.pepguideiq.workers.dev/avatars/<key>
--
-- After this migration, the Worker is the single writer for new rows and always
-- writes the full URL via publicMemberAvatarUrl(request, key).

-- 1) bare R2 key (no leading slash, no scheme, no "avatars/" prefix)
UPDATE public.member_profiles
SET avatar_url = 'https://pepguideiq-api-proxy.pepguideiq.workers.dev/avatars/' || avatar_url
WHERE avatar_url IS NOT NULL
  AND avatar_url <> ''
  AND avatar_url NOT LIKE 'http%'
  AND avatar_url NOT LIKE '/%'
  AND avatar_url NOT LIKE 'avatars/%';

-- 2) "/avatars/<key>" path
UPDATE public.member_profiles
SET avatar_url = 'https://pepguideiq-api-proxy.pepguideiq.workers.dev' || avatar_url
WHERE avatar_url IS NOT NULL
  AND avatar_url LIKE '/avatars/%';

-- 3) "avatars/<key>" path
UPDATE public.member_profiles
SET avatar_url = 'https://pepguideiq-api-proxy.pepguideiq.workers.dev/' || avatar_url
WHERE avatar_url IS NOT NULL
  AND avatar_url LIKE 'avatars/%';
