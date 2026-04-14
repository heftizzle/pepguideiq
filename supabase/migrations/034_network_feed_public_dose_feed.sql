-- Public read of active dose posts + enriched RPC for Network tab (joins bypass profiles RLS).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified_credential TEXT;

COMMENT ON COLUMN public.profiles.verified_credential IS
  'Optional external verification label (e.g. Finnrick); Network shows a badge when set.';

-- Authenticated users may read any non-expired dose feed row (live public feed).
DROP POLICY IF EXISTS "network_feed: select public active" ON public.network_feed;

CREATE POLICY "network_feed: select public active"
  ON public.network_feed FOR SELECT
  TO authenticated
  USING (expires_at > timezone('utc', now()));

COMMENT ON POLICY "network_feed: select public active" ON public.network_feed IS
  'Read dose posts that are still live (expires_at > now), for any authenticated user.';

-- Enriched JSON for Network UI (joins member_profiles default slot, profiles, user_stacks).
CREATE OR REPLACE FUNCTION public.get_public_network_dose_feed ()
  RETURNS JSONB
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(x.row_obj ORDER BY x.sort_at DESC),
    '[]'::jsonb
  )
  FROM (
    SELECT
      nf.created_at AS sort_at,
      jsonb_build_object(
        'id', nf.id,
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
    ORDER BY nf.created_at DESC
    LIMIT 50
  ) x;
$$;

REVOKE ALL ON FUNCTION public.get_public_network_dose_feed () FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_network_dose_feed () TO authenticated;

COMMENT ON FUNCTION public.get_public_network_dose_feed () IS
  'Authenticated: up to 50 active dose network posts with poster handle, verification, stack label; SECURITY DEFINER for cross-user profile fields.';
