-- Canonical hashtags + junction to network posts (public.posts).

CREATE TABLE IF NOT EXISTS public.hashtags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag         text NOT NULL,
  post_count  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hashtags_tag_unique UNIQUE (tag),
  CONSTRAINT hashtags_tag_format_chk CHECK (tag ~ '^[a-z0-9_]{1,50}$'),
  CONSTRAINT hashtags_post_count_nonnegative_chk CHECK (post_count >= 0)
);

CREATE TABLE IF NOT EXISTS public.post_hashtags (
  post_id     uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hashtag_id  uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, hashtag_id)
);

CREATE INDEX IF NOT EXISTS hashtags_tag_idx ON public.hashtags (tag);
CREATE INDEX IF NOT EXISTS hashtags_post_count_idx ON public.hashtags (post_count DESC);
CREATE INDEX IF NOT EXISTS post_hashtags_hashtag_id_idx ON public.post_hashtags (hashtag_id);
CREATE INDEX IF NOT EXISTS post_hashtags_post_id_idx ON public.post_hashtags (post_id);

DROP TRIGGER IF EXISTS hashtags_updated_at ON public.hashtags;
CREATE TRIGGER hashtags_updated_at
  BEFORE UPDATE ON public.hashtags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hashtags: select authenticated" ON public.hashtags;
CREATE POLICY "hashtags: select authenticated"
  ON public.hashtags FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "post_hashtags: select authenticated" ON public.post_hashtags;
CREATE POLICY "post_hashtags: select authenticated"
  ON public.post_hashtags FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON public.hashtags TO authenticated;
GRANT SELECT ON public.post_hashtags TO authenticated;
GRANT ALL ON public.hashtags TO service_role;
GRANT ALL ON public.post_hashtags TO service_role;

COMMENT ON TABLE public.hashtags IS 'Lowercase hashtag registry; post_count maintained by triggers.';
COMMENT ON TABLE public.post_hashtags IS 'Many-to-many posts ↔ hashtags; writes via SECURITY DEFINER triggers only.';
