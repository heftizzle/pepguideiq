-- Migration 095: Atlas Research History
-- Per-profile AI thread memory with tier limits, auto-archive, and fork/continue support

-- ─── THREADS ───────────────────────────────────────────────
CREATE TABLE public.ai_threads (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT        NOT NULL DEFAULT 'New Thread',
  archived      BOOLEAN     NOT NULL DEFAULT false,
  message_count INTEGER     NOT NULL DEFAULT 0,
  forked_from   UUID        REFERENCES public.ai_threads(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── MESSAGES ──────────────────────────────────────────────
CREATE TABLE public.ai_messages (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id   UUID        NOT NULL REFERENCES public.ai_threads(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     TEXT        NOT NULL,
  tokens_used INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEXES ───────────────────────────────────────────────
CREATE INDEX idx_ai_threads_profile_id  ON public.ai_threads(profile_id);
CREATE INDEX idx_ai_threads_updated_at  ON public.ai_threads(updated_at DESC);
CREATE INDEX idx_ai_messages_thread_id  ON public.ai_messages(thread_id);
CREATE INDEX idx_ai_messages_created_at ON public.ai_messages(created_at ASC);

-- ─── UPDATED_AT TRIGGER ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_ai_thread_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ai_threads_updated_at
  BEFORE UPDATE ON public.ai_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_thread_timestamp();

-- ─── MESSAGE COUNT TRIGGER ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_thread_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ai_threads
  SET message_count = message_count + 1,
      updated_at    = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ai_messages_count
  AFTER INSERT ON public.ai_messages
  FOR EACH ROW EXECUTE FUNCTION public.increment_thread_message_count();

-- ─── RLS ───────────────────────────────────────────────────
ALTER TABLE public.ai_threads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_threads_select" ON public.ai_threads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ai_threads_insert" ON public.ai_threads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_threads_update" ON public.ai_threads
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "ai_threads_delete" ON public.ai_threads
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "ai_messages_select" ON public.ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_threads t
      WHERE t.id = thread_id
      AND   t.user_id = auth.uid()
    )
  );

CREATE POLICY "ai_messages_insert" ON public.ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_threads t
      WHERE t.id = thread_id
      AND   t.user_id = auth.uid()
    )
  );

-- ─── THREAD LIMIT FUNCTION ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_thread_limit(plan_slug TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE plan_slug
    WHEN 'entry' THEN 5
    WHEN 'pro'   THEN 10
    WHEN 'elite' THEN 20
    WHEN 'goat'  THEN 30
    ELSE 5
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─── PG_CRON: 30-DAY AUTO-ARCHIVE ─────────────────────────
SELECT cron.schedule(
  'archive-inactive-atlas-threads',
  '0 2 * * *',
  $$
    UPDATE public.ai_threads
    SET    archived = true
    WHERE  updated_at < now() - interval '30 days'
    AND    archived = false;
  $$
);
