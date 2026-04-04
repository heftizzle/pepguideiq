-- Align public stack share RPC with user_stacks columns: stack + share_id only (no stack_name).

CREATE OR REPLACE FUNCTION public.get_shared_stack(p_share_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  sid TEXT;
BEGIN
  sid := NULLIF(trim(COALESCE(p_share_id, '')), '');
  IF sid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'stack', COALESCE(us.stack, '[]'::jsonb)
  )
  INTO result
  FROM public.user_stacks us
  WHERE us.share_id = sid
  LIMIT 1;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_stack(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_stack(TEXT) TO anon, authenticated;

ALTER TABLE public.user_stacks
  DROP COLUMN IF EXISTS stack_name;
