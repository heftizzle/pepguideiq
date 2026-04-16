-- Align signup with a default member_profiles row immediately after profiles.
-- `ON CONFLICT DO NOTHING` requires a unique arbiter; we use the partial unique index
-- member_profiles_one_default_per_user (user_id) WHERE (is_default = true).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mid UUID;
BEGIN
  INSERT INTO public.profiles (id, email, name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'entry')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.member_profiles (user_id, display_name, is_default)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    true
  )
  ON CONFLICT (user_id) WHERE (is_default = true) DO NOTHING;

  SELECT id INTO mid
  FROM public.member_profiles
  WHERE user_id = NEW.id AND is_default = true
  LIMIT 1;

  IF mid IS NULL THEN
    SELECT id INTO mid FROM public.member_profiles WHERE user_id = NEW.id ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF mid IS NOT NULL THEN
    INSERT INTO public.user_stacks (user_id, stack, profile_id)
    VALUES (NEW.id, '[]'::jsonb, mid)
    ON CONFLICT (user_id, profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
