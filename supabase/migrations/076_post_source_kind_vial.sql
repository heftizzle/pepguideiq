-- ============================================================
-- 076_post_source_kind_vial.sql
-- Phase 4 — add 'vial' to polymorphic post_source_kind enum.
-- Idempotent: skips if enum label already exists (PG-compatible).
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'post_source_kind'
      AND t.typnamespace = 'public'::regnamespace
      AND e.enumlabel = 'vial'
  ) THEN
    ALTER TYPE public.post_source_kind ADD VALUE 'vial';
  END IF;
END $$;
