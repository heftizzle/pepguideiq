-- Migration 096: Fix ai_threads.profile_id FK to reference member_profiles
-- The original migration 095 pointed at profiles(id) (legacy single-profile table).
-- All activeProfileId values in the frontend are member_profiles.id UUIDs.
-- Already applied to production DB manually; this file keeps the repo in sync.

ALTER TABLE public.ai_threads
  DROP CONSTRAINT IF EXISTS ai_threads_profile_id_fkey;

ALTER TABLE public.ai_threads
  ADD CONSTRAINT ai_threads_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.member_profiles(id) ON DELETE CASCADE;
