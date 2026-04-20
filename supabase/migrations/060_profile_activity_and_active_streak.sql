-- Active streak: consecutive local calendar days with engagement (dose, post, metrics, fast, scan, stack edit).
-- Replaces dose-only UTC streak (see 029 / 042).

CREATE OR REPLACE VIEW public.profile_activity_days AS
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
  'Per-profile local-date activity across engagement sources. Used by recalculate_member_profile_active_streak.';

CREATE OR REPLACE FUNCTION public.recalculate_member_profile_active_streak(p_profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  mp_tz     text;
  today_l   date;
  yday_l    date;
  max_d     date;
  anchor_d  date;
  grp       date;
  streak    int := 0;
BEGIN
  IF p_profile_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(timezone, 'UTC') INTO mp_tz
  FROM public.member_profiles
  WHERE id = p_profile_id;

  IF mp_tz IS NULL THEN
    RETURN 0;
  END IF;

  today_l := (CURRENT_TIMESTAMP AT TIME ZONE mp_tz)::date;
  yday_l := today_l - 1;

  SELECT MAX(activity_day) INTO max_d
  FROM public.profile_activity_days
  WHERE profile_id = p_profile_id;

  IF max_d IS NULL OR (max_d <> today_l AND max_d <> yday_l) THEN
    UPDATE public.member_profiles SET current_streak = 0 WHERE id = p_profile_id;
    RETURN 0;
  END IF;

  anchor_d := CASE WHEN max_d = today_l THEN today_l ELSE yday_l END;

  WITH days AS (
    SELECT DISTINCT activity_day AS day
    FROM public.profile_activity_days
    WHERE profile_id = p_profile_id
  ), grp_calc AS (
    SELECT day, (day - (ROW_NUMBER() OVER (ORDER BY day ASC))::integer)::date AS streak_grp
    FROM days
  )
  SELECT streak_grp INTO grp
  FROM grp_calc
  WHERE day = anchor_d;

  IF grp IS NULL THEN
    UPDATE public.member_profiles SET current_streak = 0 WHERE id = p_profile_id;
    RETURN 0;
  END IF;

  WITH days AS (
    SELECT DISTINCT activity_day AS day
    FROM public.profile_activity_days
    WHERE profile_id = p_profile_id
  ), grp_calc AS (
    SELECT day, (day - (ROW_NUMBER() OVER (ORDER BY day ASC))::integer)::date AS streak_grp
    FROM days
  )
  SELECT COUNT(*)::integer INTO streak
  FROM grp_calc
  WHERE streak_grp = grp
    AND day <= anchor_d;

  UPDATE public.member_profiles SET current_streak = streak WHERE id = p_profile_id;
  RETURN streak;
END;
$function$;

COMMENT ON FUNCTION public.recalculate_member_profile_active_streak(uuid) IS
  'Sets member_profiles.current_streak from profile_activity_days in the profile timezone.';

CREATE OR REPLACE FUNCTION public.any_activity_touch_active_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  pid uuid;
BEGIN
  pid := CASE
    WHEN TG_TABLE_NAME = 'member_fasts' THEN COALESCE(NEW.member_profile_id, OLD.member_profile_id)
    ELSE COALESCE(NEW.profile_id, OLD.profile_id)
  END;

  IF pid IS NOT NULL THEN
    PERFORM public.recalculate_member_profile_active_streak(pid);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS dose_logs_recalc_member_streak ON public.dose_logs;
DROP FUNCTION IF EXISTS public.dose_logs_touch_member_streak();
DROP FUNCTION IF EXISTS public.recalculate_member_profile_streak(uuid);

CREATE TRIGGER dose_logs_active_streak
  AFTER INSERT OR UPDATE OR DELETE ON public.dose_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.any_activity_touch_active_streak();

CREATE TRIGGER network_feed_active_streak
  AFTER INSERT OR UPDATE OR DELETE ON public.network_feed
  FOR EACH ROW
  EXECUTE FUNCTION public.any_activity_touch_active_streak();

CREATE TRIGGER body_metrics_active_streak
  AFTER INSERT OR UPDATE OR DELETE ON public.body_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.any_activity_touch_active_streak();

CREATE TRIGGER member_fasts_active_streak
  AFTER INSERT OR UPDATE OR DELETE ON public.member_fasts
  FOR EACH ROW
  EXECUTE FUNCTION public.any_activity_touch_active_streak();

CREATE TRIGGER inbody_scan_history_active_streak
  AFTER INSERT OR UPDATE OR DELETE ON public.inbody_scan_history
  FOR EACH ROW
  EXECUTE FUNCTION public.any_activity_touch_active_streak();

-- Omit INSERT: new empty user_stacks rows are created with every member profile and must not seed a streak day.
CREATE TRIGGER user_stacks_active_streak
  AFTER UPDATE OR DELETE ON public.user_stacks
  FOR EACH ROW
  EXECUTE FUNCTION public.any_activity_touch_active_streak();

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.member_profiles LOOP
    PERFORM public.recalculate_member_profile_active_streak(r.id);
  END LOOP;
END $$;
