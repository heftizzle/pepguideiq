-- Allow authenticated users to flip their own dose posts to the public feed after insert.

GRANT UPDATE (public_visible) ON public.network_feed TO authenticated;

DROP POLICY IF EXISTS "network_feed: update own" ON public.network_feed;

CREATE POLICY "network_feed: update own"
  ON public.network_feed FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "network_feed: update own" ON public.network_feed IS
  'Owner may update own rows (e.g. public_visible after Post It). Column grant limits writes to public_visible.';
