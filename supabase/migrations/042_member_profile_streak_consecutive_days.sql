-- Fix member_profiles.current_streak: count consecutive UTC calendar days with ≥1 dose,
-- anchored on the latest dose day when it is today or yesterday (unchanged policy from 029).
-- Replaces WHILE/EXISTS loop with ROW_NUMBER grouping so the streak increments across days correctly.

CREATE OR REPLACE FUNCTION public.recalculate_member_profile_streak(p_profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_d date;
  today_u date;
  yesterday_u date;
  anchor_d date;
  streak int := 0;
  grp date;
BEGIN
  IF p_profile_id IS NULL THEN
    RETURN 0;
  END IF;

  today_u := (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date;
  yesterday_u := today_u - 1;

  SELECT MAX((dl.dosed_at AT TIME ZONE 'UTC')::date)
  INTO max_d
  FROM public.dose_logs dl
  WHERE dl.profile_id = p_profile_id;

  IF max_d IS NULL THEN
    UPDATE public.member_profiles SET current_streak = 0 WHERE id = p_profile_id;
    RETURN 0;
  END IF;

  IF max_d <> today_u AND max_d <> yesterday_u THEN
    UPDATE public.member_profiles SET current_streak = 0 WHERE id = p_profile_id;
    RETURN 0;
  END IF;

  IF max_d = today_u THEN
    anchor_d := today_u;
  ELSE
    anchor_d := yesterday_u;
  END IF;

  SELECT r.streak_grp
  INTO grp
  FROM (
    SELECT
      d.day,
      (d.day - (ROW_NUMBER() OVER (ORDER BY d.day ASC))::integer)::date AS streak_grp
    FROM (
      SELECT DISTINCT ((dl.dosed_at AT TIME ZONE 'UTC'))::date AS day
      FROM public.dose_logs dl
      WHERE dl.profile_id = p_profile_id
    ) AS d
  ) AS r
  WHERE r.day = anchor_d;

  IF grp IS NULL THEN
    UPDATE public.member_profiles SET current_streak = 0 WHERE id = p_profile_id;
    RETURN 0;
  END IF;

  SELECT COUNT(*)::int
  INTO streak
  FROM (
    SELECT
      d.day,
      (d.day - (ROW_NUMBER() OVER (ORDER BY d.day ASC))::integer)::date AS streak_grp
    FROM (
      SELECT DISTINCT ((dl.dosed_at AT TIME ZONE 'UTC'))::date AS day
      FROM public.dose_logs dl
      WHERE dl.profile_id = p_profile_id
    ) AS d
  ) AS r
  WHERE r.streak_grp = grp
    AND r.day <= anchor_d;

  UPDATE public.member_profiles SET current_streak = streak WHERE id = p_profile_id;
  RETURN streak;
END;
$$;

COMMENT ON FUNCTION public.recalculate_member_profile_streak(uuid) IS
  'Sets member_profiles.current_streak to count of consecutive UTC days with ≥1 dose_log ending at anchor (today if dosed today, else yesterday). Uses ROW_NUMBER date streak grouping.';

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.member_profiles LOOP
    PERFORM public.recalculate_member_profile_streak(r.id);
  END LOOP;
END $$;
