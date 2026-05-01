-- Extract #tags from post body and sync post_hashtags + hashtags.post_count.

CREATE OR REPLACE FUNCTION public.extract_hashtags(content text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT lower(m[1])
      FROM regexp_matches(COALESCE(content, ''), '#([a-zA-Z][a-zA-Z0-9_]{0,49})', 'g') AS m
    ),
    ARRAY[]::text[]
  );
$$;

COMMENT ON FUNCTION public.extract_hashtags(text) IS
  'Returns distinct lowercase tags (no # prefix) from text; letters/digits/underscore, max 50 chars per tag.';

REVOKE ALL ON FUNCTION public.extract_hashtags(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.extract_hashtags(text) TO service_role;

-- BEFORE DELETE: decrement counts and remove junction rows before FK CASCADE.
CREATE OR REPLACE FUNCTION public.sync_post_hashtags_before_post_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
BEGIN
  FOR tid IN SELECT hashtag_id FROM public.post_hashtags WHERE post_id = OLD.id
  LOOP
    UPDATE public.hashtags
    SET post_count = GREATEST(0, post_count - 1),
        updated_at = now()
    WHERE id = tid;
  END LOOP;
  DELETE FROM public.post_hashtags WHERE post_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS posts_sync_hashtags_before_delete ON public.posts;
CREATE TRIGGER posts_sync_hashtags_before_delete
  BEFORE DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_hashtags_before_post_delete();

-- AFTER INSERT / UPDATE OF content: rebuild links for this post.
CREATE OR REPLACE FUNCTION public.sync_post_hashtags_after_content_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid uuid;
  t   text;
  h_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.content IS NOT DISTINCT FROM OLD.content THEN
    RETURN NEW;
  END IF;

  FOR tid IN SELECT hashtag_id FROM public.post_hashtags WHERE post_id = NEW.id
  LOOP
    UPDATE public.hashtags
    SET post_count = GREATEST(0, post_count - 1),
        updated_at = now()
    WHERE id = tid;
  END LOOP;
  DELETE FROM public.post_hashtags WHERE post_id = NEW.id;

  IF NEW.content IS NULL OR btrim(NEW.content) = '' THEN
    RETURN NEW;
  END IF;

  FOREACH t IN ARRAY public.extract_hashtags(NEW.content)
  LOOP
    INSERT INTO public.hashtags (tag) VALUES (t)
    ON CONFLICT (tag) DO UPDATE SET updated_at = now();

    SELECT id INTO h_id FROM public.hashtags WHERE tag = t;
    IF h_id IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.post_hashtags (post_id, hashtag_id) VALUES (NEW.id, h_id)
    ON CONFLICT DO NOTHING;

    UPDATE public.hashtags
    SET post_count = post_count + 1,
        updated_at = now()
    WHERE id = h_id;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_post_hashtags_before_post_delete() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_post_hashtags_after_content_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_post_hashtags_before_post_delete() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_post_hashtags_after_content_change() TO service_role;

DROP TRIGGER IF EXISTS posts_sync_hashtags_after_content ON public.posts;
CREATE TRIGGER posts_sync_hashtags_after_content
  AFTER INSERT OR UPDATE OF content ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_hashtags_after_content_change();

-- One-time backfill for posts that already had captions (migration applies once per env).
UPDATE public.posts SET content = content WHERE content IS NOT NULL AND btrim(content) <> '';
