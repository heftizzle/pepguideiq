-- Phase 5: Extend get_public_network_dose_feed to include engagement fields
-- (post_id, like_count, comment_count) for both 'dose' and 'inbody_progress'
-- branches. LEFT JOIN posts so feed still renders if projection somehow misses
-- a row (graceful degradation; frontend hides engagement when post_id is null).

CREATE OR REPLACE FUNCTION public.get_public_network_dose_feed()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
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
              'avatar_r2_key', mp.avatar_r2_key,
              'user_id', nf.user_id,
              'stack_label',
                CASE
                  WHEN nf.stack_id IS NULL THEN NULL
                  ELSE COALESCE(
                    NULLIF(trim((us.stack -> 0 ->> 'name')), ''),
                    'Saved stack'
                  )
                END,
              'post_id', dp.id,
              'like_count', COALESCE(dp.like_count, 0),
              'comment_count', COALESCE(dp.comment_count, 0)
            ) AS row_obj
          FROM public.network_feed nf
          LEFT JOIN public.profiles p ON p.id = nf.user_id
          LEFT JOIN LATERAL (
            SELECT mp1.handle, mp1.display_handle, mp1.display_name, mp1.avatar_r2_key
            FROM public.member_profiles mp1
            WHERE mp1.user_id = nf.user_id
            ORDER BY mp1.is_default DESC NULLS LAST, mp1.created_at ASC NULLS LAST
            LIMIT 1
          ) mp ON TRUE
          LEFT JOIN public.user_stacks us ON us.id = nf.stack_id
          LEFT JOIN public.posts dp
            ON dp.source_kind = 'dose'
           AND dp.source_id = nf.id
           AND dp.visible_network = true
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
              'avatar_r2_key', mp.avatar_r2_key,
              'user_id', nf.user_id,
              'content_json', nf.content_json,
              'post_id', ip.id,
              'like_count', COALESCE(ip.like_count, 0),
              'comment_count', COALESCE(ip.comment_count, 0)
            ) AS row_obj
          FROM public.network_feed nf
          INNER JOIN public.member_profiles mp ON mp.id = nf.profile_id
          INNER JOIN public.profiles p ON p.id = nf.user_id
          LEFT JOIN public.posts ip
            ON ip.source_kind = 'inbody_progress'
           AND ip.source_id = nf.id
           AND ip.visible_network = true
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
$function$;
