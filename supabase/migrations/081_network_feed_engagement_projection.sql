-- Phase 5: Project public-visible network_feed rows (dose + inbody_progress)
-- into the posts table so the existing engagement layer (likes, comments,
-- notifications) works against them. Triggers all SECURITY DEFINER per the
-- rule established after Bug B (denorm-sync triggers must bypass RLS).

CREATE OR REPLACE FUNCTION public._resolve_default_profile_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mp.id
  FROM public.member_profiles mp
  WHERE mp.user_id = p_user_id
  ORDER BY mp.is_default DESC NULLS LAST, mp.created_at ASC NULLS LAST
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.project_network_feed_to_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_source_kind public.post_source_kind;
BEGIN
  IF NEW.public_visible IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.post_type = 'dose' THEN
    v_source_kind := 'dose';
  ELSIF NEW.post_type = 'inbody_progress' THEN
    v_source_kind := 'inbody_progress';
  ELSE
    RETURN NEW;
  END IF;

  v_profile_id := COALESCE(
    NEW.profile_id,
    public._resolve_default_profile_id(NEW.user_id)
  );
  IF v_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.posts (
    profile_id, source_kind, source_id,
    visible_network, visible_profile, created_at
  )
  VALUES (
    v_profile_id, v_source_kind, NEW.id,
    true, false, NEW.created_at
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_network_feed_to_post ON public.network_feed;
CREATE TRIGGER trg_project_network_feed_to_post
AFTER INSERT ON public.network_feed
FOR EACH ROW
EXECUTE FUNCTION public.project_network_feed_to_post();

CREATE OR REPLACE FUNCTION public.sync_network_feed_post_visibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_source_kind public.post_source_kind;
BEGIN
  IF NEW.post_type = 'dose' THEN
    v_source_kind := 'dose';
  ELSIF NEW.post_type = 'inbody_progress' THEN
    v_source_kind := 'inbody_progress';
  ELSE
    RETURN NEW;
  END IF;

  IF (OLD.public_visible IS NOT TRUE) AND (NEW.public_visible IS TRUE) THEN
    v_profile_id := COALESCE(
      NEW.profile_id,
      public._resolve_default_profile_id(NEW.user_id)
    );
    IF v_profile_id IS NOT NULL THEN
      INSERT INTO public.posts (
        profile_id, source_kind, source_id,
        visible_network, visible_profile, created_at
      )
      VALUES (
        v_profile_id, v_source_kind, NEW.id,
        true, false, NEW.created_at
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  IF (OLD.public_visible IS TRUE) AND (NEW.public_visible IS NOT TRUE) THEN
    DELETE FROM public.posts
    WHERE source_kind = v_source_kind AND source_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_network_feed_post_visibility ON public.network_feed;
CREATE TRIGGER trg_sync_network_feed_post_visibility
AFTER UPDATE OF public_visible ON public.network_feed
FOR EACH ROW
EXECUTE FUNCTION public.sync_network_feed_post_visibility();

CREATE OR REPLACE FUNCTION public.cleanup_post_on_network_feed_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_kind public.post_source_kind;
BEGIN
  IF OLD.post_type = 'dose' THEN
    v_source_kind := 'dose';
  ELSIF OLD.post_type = 'inbody_progress' THEN
    v_source_kind := 'inbody_progress';
  ELSE
    RETURN OLD;
  END IF;

  DELETE FROM public.posts
  WHERE source_kind = v_source_kind AND source_id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_post_on_network_feed_delete ON public.network_feed;
CREATE TRIGGER trg_cleanup_post_on_network_feed_delete
AFTER DELETE ON public.network_feed
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_post_on_network_feed_delete();

INSERT INTO public.posts (
  profile_id, source_kind, source_id,
  visible_network, visible_profile, created_at
)
SELECT
  COALESCE(
    nf.profile_id,
    public._resolve_default_profile_id(nf.user_id)
  ) AS profile_id,
  CASE
    WHEN nf.post_type = 'dose' THEN 'dose'::public.post_source_kind
    WHEN nf.post_type = 'inbody_progress' THEN 'inbody_progress'::public.post_source_kind
  END AS source_kind,
  nf.id,
  true,
  false,
  nf.created_at
FROM public.network_feed nf
WHERE nf.post_type IN ('dose', 'inbody_progress')
  AND nf.public_visible = true
  AND nf.expires_at > timezone('utc', now())
  AND COALESCE(
    nf.profile_id,
    public._resolve_default_profile_id(nf.user_id)
  ) IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_posts_dose_source
  ON public.posts (source_id) WHERE source_kind = 'dose';
CREATE INDEX IF NOT EXISTS idx_posts_inbody_source
  ON public.posts (source_id) WHERE source_kind = 'inbody_progress';
