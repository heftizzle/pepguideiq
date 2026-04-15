-- H5: network_feed.public_visible + stricter public SELECT policy.
-- H6: profiles.verified_credential enum CHECK; authenticated cannot UPDATE that column.
-- M5: dose_logs covering index; get_network_feed row cap 50.
-- M6: FK-adjacent indexes.
-- L1: drop unused ai_queries; repoint get_daily_ai_count to query_log.

-- ─── H5: network_feed.public_visible ───────────────────────────────────────

ALTER TABLE public.network_feed
  ADD COLUMN IF NOT EXISTS public_visible BOOLEAN;

UPDATE public.network_feed
SET public_visible = true
WHERE public_visible IS NULL;

ALTER TABLE public.network_feed
  ALTER COLUMN public_visible SET NOT NULL,
  ALTER COLUMN public_visible SET DEFAULT false;

COMMENT ON COLUMN public.network_feed.public_visible IS
  'When true, row appears in authenticated public dose feed policy and get_public_network_dose_feed.';

DROP POLICY IF EXISTS "network_feed: select public active" ON public.network_feed;

CREATE POLICY "network_feed: select public active"
  ON public.network_feed FOR SELECT
  TO authenticated
  USING (
    expires_at > timezone('utc', now())
    AND public_visible = true
  );

COMMENT ON POLICY "network_feed: select public active" ON public.network_feed IS
  'Read dose posts that are still live, marked public_visible, for any authenticated user.';

-- ─── H6: verified_credential CHECK + column-level UPDATE revoke ───────────

UPDATE public.profiles
SET verified_credential = NULL
WHERE verified_credential IS NOT NULL
  AND verified_credential NOT IN (
    'verified_user',
    'researcher',
    'coach',
    'medical_professional'
  );

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_verified_credential_enum_chk;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_verified_credential_enum_chk
  CHECK (
    verified_credential IS NULL
    OR verified_credential IN (
      'verified_user',
      'researcher',
      'coach',
      'medical_professional'
    )
  );

REVOKE UPDATE ON public.profiles FROM authenticated;

-- Column list: excludes verified_credential (H6), stripe_customer_id, pending_plan, pending_plan_date
-- (service role / Worker only). Confirmed on profiles: stack_photo_url (004), stack_photo_r2_key (008),
-- stack_shot_* (009), default_session (012), subscription_status (040).

GRANT UPDATE (
  email,
  name,
  plan,
  created_at,
  updated_at,
  stack_photo_url,
  display_name,
  avatar_r2_key,
  goal,
  weight_lbs,
  height_in,
  body_fat_pct,
  default_session,
  weight_unit,
  stack_photo_r2_key,
  stack_shot_1_r2_key,
  stack_shot_2_r2_key,
  stripe_subscription_id,
  stripe_price_id,
  subscription_status
) ON public.profiles TO authenticated;

-- ─── M5: dose_logs index + get_network_feed cap 50 ───────────────────────

CREATE INDEX IF NOT EXISTS idx_dose_logs_user_profile
  ON public.dose_logs (user_id, profile_id)
  INCLUDE (peptide_id, dosed_at);

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
          'updated_at', sub.updated_at
        )
        ORDER BY sub.updated_at DESC
      )
      FROM (
        SELECT
          us.share_id AS share_id,
          COALESCE(NULLIF(btrim(us.share_id), ''), 'My Stack') AS stack_name,
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
          us.updated_at AS updated_at
        FROM public.user_stacks us
        INNER JOIN public.member_profiles mp ON mp.id = us.profile_id
        INNER JOIN public.profiles p ON p.id = mp.user_id
        WHERE us.feed_visible = true
          AND us.share_id IS NOT NULL
          AND btrim(us.share_id) <> ''
        ORDER BY us.updated_at DESC
        LIMIT 50
      ) sub
    ),
    '[]'::jsonb
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_network_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_network_feed() TO authenticated;

COMMENT ON FUNCTION public.get_network_feed() IS
  'Authenticated: network-visible stacks (max 50); stack_name from share_id; display_handle when set; pepguideIQ score; updated_at.';

-- ─── M6: FK helper indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS dose_logs_profile_id_idx ON public.dose_logs (profile_id);

CREATE INDEX IF NOT EXISTS network_feed_stack_id_idx
  ON public.network_feed (stack_id)
  WHERE stack_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS network_feed_dose_log_id_idx ON public.network_feed (dose_log_id);

CREATE INDEX IF NOT EXISTS notifications_actor_id_idx ON public.notifications (actor_id);

-- ─── get_public_network_dose_feed: respect public_visible ─────────────────

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
      AND nf.public_visible = true
    ORDER BY nf.created_at DESC
    LIMIT 50
  ) x;
$$;

REVOKE ALL ON FUNCTION public.get_public_network_dose_feed () FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_network_dose_feed () TO authenticated;

COMMENT ON FUNCTION public.get_public_network_dose_feed () IS
  'Authenticated: up to 50 active dose network posts with public_visible; poster handle, verification, stack label; SECURITY DEFINER.';

-- ─── L1: ai_queries removal; get_daily_ai_count → query_log ───────────────
-- DROP required if the live DB used a different argument name (e.g. `uid`); CREATE OR REPLACE cannot rename parameters (42P13).

DROP FUNCTION IF EXISTS public.get_daily_ai_count(uuid);

CREATE OR REPLACE FUNCTION public.get_daily_ai_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.query_log
  WHERE user_id = p_user_id
    AND queried_at >= CURRENT_DATE::TIMESTAMPTZ
    AND queried_at < (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ;
$$;

DROP POLICY IF EXISTS "ai_queries: select own" ON public.ai_queries;
DROP POLICY IF EXISTS "ai_queries: insert own" ON public.ai_queries;

DROP TABLE IF EXISTS public.ai_queries;
