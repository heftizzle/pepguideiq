-- Plan tier: only service role, trusted RPC, or explicit session flag may change profiles.plan.
-- Stack photos: store R2 object key for Worker-only reads (see GET /stack-photo on api-proxy).

-- 1) R2 object key (e.g. "{user_id}/stack.jpg"); Worker serves bytes with auth — no public URL required.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stack_photo_r2_key TEXT;

COMMENT ON COLUMN public.profiles.stack_photo_r2_key IS 'R2 object key inside bucket stack-photos; served via Worker GET /stack-photo.';

-- Backfill from legacy public URLs (path after host = key).
UPDATE public.profiles
SET stack_photo_r2_key = regexp_replace(
  regexp_replace(stack_photo_url, '^https?://[^/]+/', ''),
  '\?.*$',
  ''
)
WHERE stack_photo_url IS NOT NULL
  AND stack_photo_url <> ''
  AND (stack_photo_r2_key IS NULL OR stack_photo_r2_key = '');

-- 2) Enforce plan changes: only `update_user_plan` sets `app.allow_plan_change` in-session (trusted RPC).
CREATE OR REPLACE FUNCTION public.profiles_enforce_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.plan IS DISTINCT FROM OLD.plan THEN
    IF current_setting('app.allow_plan_change', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Plan can only be updated via public.update_user_plan (service role)'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_enforce_plan_change ON public.profiles;
CREATE TRIGGER profiles_enforce_plan_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_enforce_plan_change();

-- 3) Trusted RPC sets session flag then updates plan + JWT metadata (webhooks / admin tools).
CREATE OR REPLACE FUNCTION public.update_user_plan(p_user_id UUID, p_plan TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_plan NOT IN ('entry', 'pro', 'elite', 'goat') THEN
    RAISE EXCEPTION 'Invalid plan: %', p_plan;
  END IF;

  PERFORM set_config('app.allow_plan_change', 'true', true);

  UPDATE public.profiles
  SET plan = p_plan, updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('plan', p_plan)
  WHERE id = p_user_id;
END;
$$;

-- Only service role should call this from Edge Functions / tooling (not end users).
REVOKE ALL ON FUNCTION public.update_user_plan(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_plan(UUID, TEXT) TO service_role;
