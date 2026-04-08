-- Shopping list archive
-- Saves every generated cycle order list, tied to user + profile
-- Auto-save on "Copy Shopping List" — no extra user action required
-- Max 10 per profile enforced in app

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id   UUID NOT NULL REFERENCES public.member_profiles(id) ON DELETE CASCADE,
  stack_name   TEXT,
  cycle_weeks  INTEGER NOT NULL DEFAULT 8,
  items        JSONB NOT NULL DEFAULT '[]',
  -- items shape: [{name, dose, frequency, totalMg, vials, vialSize}]
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user/profile lookups
CREATE INDEX IF NOT EXISTS shopping_lists_user_profile_idx
  ON public.shopping_lists (user_id, profile_id, created_at DESC);

-- RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own shopping lists"
  ON public.shopping_lists FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = shopping_lists.profile_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own shopping lists"
  ON public.shopping_lists FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = shopping_lists.profile_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own shopping lists"
  ON public.shopping_lists FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = shopping_lists.profile_id AND mp.user_id = auth.uid()
    )
  );

GRANT ALL ON public.shopping_lists TO authenticated;
GRANT ALL ON public.shopping_lists TO service_role;
