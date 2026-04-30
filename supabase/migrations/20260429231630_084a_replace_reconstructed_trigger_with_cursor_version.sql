-- 084: Replace reconstructed trigger with cursor version
-- Syncs default member_profile display_name → profiles.display_name

CREATE OR REPLACE FUNCTION public.member_profiles_sync_account_display_name()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_default IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles p
  SET
    display_name = NEW.display_name,
    updated_at   = NOW()
  WHERE p.id = NEW.user_id
    AND p.display_name IS DISTINCT FROM NEW.display_name;

  RETURN NEW;
END;
$function$;
