-- Consecutive dosing streak per member profile (dose_logs.profile_id).
-- UTC calendar days; streak counts days ending today or yesterday so overnight gaps don't zero the streak.
-- Client may use local-day math for display fallback; this column is updated on every dose_logs write.

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.member_profiles.current_streak IS
  'Consecutive UTC days with at least one dose_log for this profile; ends today or yesterday. Maintained by dose_logs trigger.';

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
  cursor_d date;
  streak int := 0;
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
    cursor_d := today_u;
  ELSE
    cursor_d := yesterday_u;
  END IF;

  WHILE EXISTS (
    SELECT 1
    FROM public.dose_logs dl
    WHERE dl.profile_id = p_profile_id
      AND (dl.dosed_at AT TIME ZONE 'UTC')::date = cursor_d
  ) LOOP
    streak := streak + 1;
    cursor_d := cursor_d - 1;
  END LOOP;

  UPDATE public.member_profiles SET current_streak = streak WHERE id = p_profile_id;
  RETURN streak;
END;
$$;

CREATE OR REPLACE FUNCTION public.dose_logs_touch_member_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.profile_id IS NOT NULL THEN
      PERFORM public.recalculate_member_profile_streak(OLD.profile_id);
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.profile_id IS NOT NULL AND OLD.profile_id IS DISTINCT FROM NEW.profile_id THEN
      PERFORM public.recalculate_member_profile_streak(OLD.profile_id);
    END IF;
    IF NEW.profile_id IS NOT NULL THEN
      PERFORM public.recalculate_member_profile_streak(NEW.profile_id);
    END IF;
    RETURN NEW;
  ELSE
    IF NEW.profile_id IS NOT NULL THEN
      PERFORM public.recalculate_member_profile_streak(NEW.profile_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS dose_logs_recalc_member_streak ON public.dose_logs;
CREATE TRIGGER dose_logs_recalc_member_streak
  AFTER INSERT OR UPDATE OF dosed_at, profile_id OR DELETE
  ON public.dose_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.dose_logs_touch_member_streak();

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.member_profiles LOOP
    PERFORM public.recalculate_member_profile_streak(r.id);
  END LOOP;
END $$;
