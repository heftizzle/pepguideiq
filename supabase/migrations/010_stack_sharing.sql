-- Shareable stack links. Table is public.user_stacks (one saved stack per user; product copy may say "saved stacks").
-- Public reads use get_shared_stack() only — a blanket SELECT policy on rows with share_id set would let anon
-- enumerate every shared stack; the RPC returns at most one row for a known id.

ALTER TABLE public.user_stacks
  ADD COLUMN IF NOT EXISTS share_id TEXT;

-- Unique slug when set (multiple NULL share_id allowed; one row per user anyway).
CREATE UNIQUE INDEX IF NOT EXISTS saved_stacks_share_id_idx
  ON public.user_stacks (share_id)
  WHERE share_id IS NOT NULL;

-- Single-stack lookup for anonymous clients (share link only).
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

COMMENT ON COLUMN public.user_stacks.share_id IS 'Opaque public slug for /stack/{share_id}; 8+ chars, unique when set.';
