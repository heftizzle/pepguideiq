-- InBody progress posts on network_feed (typed rows alongside dose posts).

ALTER TABLE public.network_feed
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'dose',
  ADD COLUMN IF NOT EXISTS content_json jsonb,
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.member_profiles (id) ON DELETE CASCADE;

COMMENT ON COLUMN public.network_feed.post_type IS
  'dose = linked dose_log post; inbody_progress = composition delta share (content_json).';

COMMENT ON COLUMN public.network_feed.content_json IS
  'For inbody_progress: caption, scanId, deltas, selectedMetrics, stackSnapshot, etc.';

COMMENT ON COLUMN public.network_feed.profile_id IS
  'Member profile for inbody_progress rows; null for dose posts.';

ALTER TABLE public.network_feed
  DROP CONSTRAINT IF EXISTS network_feed_dose_log_unique;

CREATE UNIQUE INDEX IF NOT EXISTS network_feed_dose_log_id_unique
  ON public.network_feed (dose_log_id)
  WHERE dose_log_id IS NOT NULL;

ALTER TABLE public.network_feed
  ALTER COLUMN dose_log_id DROP NOT NULL,
  ALTER COLUMN compound_id DROP NOT NULL;

ALTER TABLE public.network_feed
  ADD CONSTRAINT network_feed_post_shape_chk CHECK (
    (
      COALESCE(post_type, 'dose') = 'dose'
      AND dose_log_id IS NOT NULL
      AND compound_id IS NOT NULL
      AND btrim(compound_id) <> ''
    )
    OR (
      post_type = 'inbody_progress'
      AND dose_log_id IS NULL
      AND profile_id IS NOT NULL
      AND content_json IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "network_feed: insert own" ON public.network_feed;

CREATE POLICY "network_feed: insert own"
  ON public.network_feed FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      (
        COALESCE(post_type, 'dose') = 'dose'
        AND dose_log_id IS NOT NULL
      )
      OR (
        post_type = 'inbody_progress'
        AND profile_id IS NOT NULL
        AND dose_log_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.member_profiles mp
          WHERE mp.id = network_feed.profile_id
            AND mp.user_id = auth.uid()
        )
      )
    )
  );

COMMENT ON POLICY "network_feed: insert own" ON public.network_feed IS
  'Own user_id; dose rows require dose_log_id; inbody rows require owned member_profiles.id as profile_id.';

CREATE INDEX IF NOT EXISTS network_feed_profile_post_idx
  ON public.network_feed (profile_id, post_type, created_at DESC)
  WHERE profile_id IS NOT NULL;

-- Public dose + InBody feed (max 50, newest first, public_visible only).
CREATE OR REPLACE FUNCTION public.get_public_network_dose_feed ()
  RETURNS JSONB
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(u.row_obj ORDER BY u.sort_at DESC)
      FROM (
        SELECT *
        FROM (
          SELECT
            nf.created_at AS sort_at,
            jsonb_build_object(
              'id', nf.id,
              'post_type', COALESCE(nf.post_type, 'dose'),
              'created_at', nf.created_at,
              'expires_at', nf.expires_at,
              'compound_id', nf.compound_id,
              'dose_amount', nf.dose_amount,
              'dose_unit', nf.dose_unit,
              'route', nf.route,
              'session_label', nf.session_label,
              'handle', mp.handle,
              'display_handle', mp.display_handle,
              'verified_credential', p.verified_credential,
              'display_name', mp.display_name,
              'stack_label',
              CASE
                WHEN nf.stack_id IS NULL THEN NULL
                ELSE COALESCE(
                  NULLIF(trim((us.stack -> 0 ->> 'name')), ''),
                  'Saved stack'
                )
              END
            ) AS row_obj
          FROM public.network_feed nf
          LEFT JOIN public.profiles p ON p.id = nf.user_id
          LEFT JOIN LATERAL (
            SELECT
              mp1.handle,
              mp1.display_handle,
              mp1.display_name
            FROM public.member_profiles mp1
            WHERE mp1.user_id = nf.user_id
            ORDER BY mp1.is_default DESC NULLS LAST,
              mp1.created_at ASC NULLS LAST
            LIMIT 1
          ) mp ON TRUE
          LEFT JOIN public.user_stacks us ON us.id = nf.stack_id
          WHERE nf.expires_at > timezone('utc', now())
            AND nf.public_visible = true
            AND COALESCE(nf.post_type, 'dose') = 'dose'

          UNION ALL

          SELECT
            nf.created_at AS sort_at,
            jsonb_build_object(
              'id', nf.id,
              'post_type', 'inbody_progress',
              'created_at', nf.created_at,
              'expires_at', nf.expires_at,
              'handle', mp.handle,
              'display_handle', mp.display_handle,
              'verified_credential', p.verified_credential,
              'display_name', mp.display_name,
              'content_json', nf.content_json
            ) AS row_obj
          FROM public.network_feed nf
          INNER JOIN public.member_profiles mp ON mp.id = nf.profile_id
          INNER JOIN public.profiles p ON p.id = nf.user_id
          WHERE nf.expires_at > timezone('utc', now())
            AND nf.public_visible = true
            AND nf.post_type = 'inbody_progress'
        ) combined
        ORDER BY combined.sort_at DESC
        LIMIT 50
      ) u
    ),
    '[]'::jsonb
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_network_dose_feed () FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_network_dose_feed () TO authenticated;

COMMENT ON FUNCTION public.get_public_network_dose_feed () IS
  'Authenticated: active public_visible dose + InBody progress posts (max 50, newest first); SECURITY DEFINER.';
