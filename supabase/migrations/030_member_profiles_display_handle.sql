-- Public handle: canonical lowercase `handle` (unique) + `display_handle` (as typed for UI).
-- Note: app table is `member_profiles` (not auth `profiles`).

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS display_handle TEXT;

UPDATE public.member_profiles
SET display_handle = handle
WHERE handle IS NOT NULL
  AND (display_handle IS NULL OR btrim(display_handle) = '');

ALTER TABLE public.member_profiles DROP CONSTRAINT IF EXISTS member_profiles_handle_format_chk;

ALTER TABLE public.member_profiles
  ADD CONSTRAINT member_profiles_handle_format_chk
  CHECK (
    handle IS NULL
    OR (
      char_length(handle) BETWEEN 3 AND 30
      AND handle ~ '^[a-z0-9_.]+$'
      AND handle !~ '\.\.'
      AND handle !~ '^\.'
      AND handle !~ '\.$'
    )
  );

ALTER TABLE public.member_profiles DROP CONSTRAINT IF EXISTS member_profiles_display_handle_sync_chk;

ALTER TABLE public.member_profiles
  ADD CONSTRAINT member_profiles_display_handle_sync_chk
  CHECK (
    (handle IS NULL AND display_handle IS NULL)
    OR (
      handle IS NOT NULL
      AND display_handle IS NOT NULL
      AND char_length(btrim(display_handle)) BETWEEN 3 AND 30
      AND lower(btrim(display_handle)) = handle
    )
  );

COMMENT ON COLUMN public.member_profiles.handle IS
  'Globally unique public @handle (lowercase): letters, digits, underscore, period; 3–30 chars; no ..; no leading/trailing .; nullable.';

COMMENT ON COLUMN public.member_profiles.display_handle IS
  'Same handle as typed by the user (casing preserved) for display; must normalize to handle when lowercased/trimmed.';

-- Network feed: show preferred casing when present.
CREATE OR REPLACE FUNCTION public.get_network_feed()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'share_id', sub.share_id,
          'stack_name', sub.stack_name,
          'compound_count', sub.compound_count,
          'handle', sub.handle,
          'display_name', sub.display_name,
          'tier', sub.tier,
          'pepguideiq_score', sub.pepguideiq_score,
          'created_at', sub.created_at
        )
        ORDER BY sub.created_at DESC
      )
      FROM (
        SELECT
          us.share_id AS share_id,
          COALESCE(NULLIF(trim(us.stack_name), ''), 'Stack') AS stack_name,
          COALESCE(jsonb_array_length(COALESCE(us.stack, '[]'::jsonb)), 0) AS compound_count,
          COALESCE(NULLIF(trim(mp.display_handle), ''), mp.handle) AS handle,
          mp.display_name AS display_name,
          p.plan::text AS tier,
          (
            COALESCE(
              (SELECT COUNT(*)::int FROM public.dose_logs dl WHERE dl.user_id = mp.user_id AND dl.profile_id = mp.id),
              0
            )
            * 2
            + COALESCE(
              (SELECT COUNT(DISTINCT dl.peptide_id)::int FROM public.dose_logs dl WHERE dl.user_id = mp.user_id AND dl.profile_id = mp.id),
              0
            )
            * 3
            + COALESCE(
              (SELECT COUNT(*)::int FROM public.user_vials uv WHERE uv.user_id = mp.user_id AND uv.profile_id = mp.id AND uv.status = 'active'),
              0
            )
            * 1
            + COALESCE(
              (
                SELECT COUNT(DISTINCT ((dl.dosed_at AT TIME ZONE 'UTC')::date))::int
                FROM public.dose_logs dl
                WHERE dl.user_id = mp.user_id AND dl.profile_id = mp.id
              ),
              0
            )
            * 1
          ) AS pepguideiq_score,
          us.created_at AS created_at
        FROM public.user_stacks us
        INNER JOIN public.member_profiles mp ON mp.id = us.profile_id
        INNER JOIN public.profiles p ON p.id = mp.user_id
        WHERE us.feed_visible = true
          AND us.share_id IS NOT NULL
          AND btrim(us.share_id) <> ''
        ORDER BY us.created_at DESC
        LIMIT 200
      ) sub
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_network_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_network_feed() TO authenticated;
