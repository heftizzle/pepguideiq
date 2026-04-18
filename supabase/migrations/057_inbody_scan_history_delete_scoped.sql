-- Allow authenticated users to delete their own inbody_scan_history rows (replace flow).

GRANT DELETE ON public.inbody_scan_history TO authenticated;

DROP POLICY IF EXISTS "inbody_scan_history: delete scoped" ON public.inbody_scan_history;
CREATE POLICY "inbody_scan_history: delete scoped"
  ON public.inbody_scan_history FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.member_profiles mp
      WHERE mp.id = inbody_scan_history.profile_id AND mp.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "inbody_scan_history: delete scoped" ON public.inbody_scan_history IS
  'Owner may delete own scan rows (e.g. replace within scan_date proximity window).';
