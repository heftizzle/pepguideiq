CREATE OR REPLACE FUNCTION public.clear_profile_display_name_on_member_profile_delete()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $function$
BEGIN
  UPDATE profiles
  SET display_name = NULL
  WHERE id = OLD.user_id
    AND display_name = OLD.display_name;
  RETURN OLD;
END;
$function$;
