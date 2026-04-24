-- profile_activity_days: run as querying user so underlying table RLS applies (PG15+ security invoker).
-- Uses CREATE OR REPLACE (not DROP): public.recalculate_member_profile_active_streak depends on this view.

CREATE OR REPLACE VIEW public.profile_activity_days
WITH (security_invoker = true)
AS
WITH tz AS (
  SELECT id AS profile_id, COALESCE(timezone, 'UTC') AS zone
  FROM public.member_profiles
)
SELECT t.profile_id, (d.dosed_at AT TIME ZONE t.zone)::date AS activity_day, 'dose'::text AS source
FROM public.dose_logs d
JOIN tz t ON t.profile_id = d.profile_id
WHERE d.profile_id IS NOT NULL
UNION
SELECT t.profile_id, (n.created_at AT TIME ZONE t.zone)::date AS activity_day, 'network_post'::text AS source
FROM public.network_feed n
LEFT JOIN public.dose_logs d ON d.id = n.dose_log_id
JOIN tz t ON t.profile_id = COALESCE(n.profile_id, d.profile_id)
WHERE COALESCE(n.profile_id, d.profile_id) IS NOT NULL
UNION
SELECT t.profile_id, (b.created_at AT TIME ZONE t.zone)::date AS activity_day, 'body_metric'::text AS source
FROM public.body_metrics b
JOIN tz t ON t.profile_id = b.profile_id
WHERE b.profile_id IS NOT NULL
UNION
SELECT t.profile_id, (f.created_at AT TIME ZONE t.zone)::date AS activity_day, 'fast_start'::text AS source
FROM public.member_fasts f
JOIN tz t ON t.profile_id = f.member_profile_id
UNION
SELECT t.profile_id, (s.created_at AT TIME ZONE t.zone)::date AS activity_day, 'scan'::text AS source
FROM public.inbody_scan_history s
JOIN tz t ON t.profile_id = s.profile_id
UNION
SELECT t.profile_id, (u.updated_at AT TIME ZONE t.zone)::date AS activity_day, 'stack_edit'::text AS source
FROM public.user_stacks u
JOIN tz t ON t.profile_id = u.profile_id
WHERE u.profile_id IS NOT NULL;

COMMENT ON VIEW public.profile_activity_days IS
  'Per-profile local-date activity across engagement sources. Used by recalculate_member_profile_active_streak. SECURITY INVOKER (security_invoker=true): querying user, RLS on base tables applies.';
