-- ============================================================
-- 077_vial_archive_share_lifecycle.sql
-- Phase 4 — vial archive + Network share lifecycle.
--
-- Adds archived_at + share_notes_to_network on user_vials.
-- SECURITY DEFINER cleanup triggers remove mirrored posts rows so
-- engagement (071 FK chain) stays consistent.
-- set_vial_feed_visible mirrors visibility into public.posts (vial source).
-- ============================================================

ALTER TABLE public.user_vials
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS share_notes_to_network BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS user_vials_profile_archived_idx
  ON public.user_vials (profile_id, archived_at);

-- ---------------------------------------------------------------------------
-- Cleanup: vial delete removes its post (071 FKs cascade engagement).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_post_on_vial_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.posts
   WHERE source_kind = 'vial' AND source_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_post_on_vial_delete ON public.user_vials;
CREATE TRIGGER trg_cleanup_post_on_vial_delete
  AFTER DELETE ON public.user_vials
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_post_on_vial_delete();

-- ---------------------------------------------------------------------------
-- Cleanup: archiving removes mirrored network post (cannot share archived).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_post_on_vial_archive()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL THEN
    DELETE FROM public.posts
     WHERE source_kind = 'vial' AND source_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_post_on_vial_archive ON public.user_vials;
CREATE TRIGGER trg_cleanup_post_on_vial_archive
  AFTER UPDATE OF archived_at ON public.user_vials
  FOR EACH ROW
  WHEN (NEW.archived_at IS NOT NULL AND OLD.archived_at IS NULL)
  EXECUTE FUNCTION public.cleanup_post_on_vial_archive();

-- ---------------------------------------------------------------------------
-- RPC: toggle Network visibility for a vial (UPSERT posts row).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_vial_feed_visible(
  p_vial_id uuid,
  p_visible boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_user_id    uuid;
  v_archived   timestamptz;
BEGIN
  SELECT profile_id, user_id, archived_at
    INTO v_profile_id, v_user_id, v_archived
    FROM public.user_vials
   WHERE id = p_vial_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'vial not found' USING errcode = 'P0002';
  END IF;

  IF v_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not authorized' USING errcode = '42501';
  END IF;

  IF v_archived IS NOT NULL THEN
    RAISE EXCEPTION 'cannot share archived vial' USING errcode = '22023';
  END IF;

  INSERT INTO public.posts
    (profile_id, source_kind, source_id, visible_network, visible_profile)
  VALUES
    (v_profile_id, 'vial', p_vial_id, p_visible, false)
  ON CONFLICT (profile_id, source_kind, source_id)
    WHERE source_kind <> 'media'
  DO UPDATE SET visible_network = EXCLUDED.visible_network;
END;
$$;

REVOKE ALL ON FUNCTION public.set_vial_feed_visible(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_vial_feed_visible(uuid, boolean) TO authenticated;

COMMENT ON FUNCTION public.set_vial_feed_visible(uuid, boolean) IS
  'Owner toggles Network visibility for a vial; mirrors into posts (source_kind=vial). Raises 22023 if archived.';

NOTIFY pgrst, 'reload schema';
