-- Profile launch: bio, experience, body scan (R2 + OCR flag), progress pose photos (R2).

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS experience_level TEXT,
  ADD COLUMN IF NOT EXISTS body_scan_r2_key TEXT,
  ADD COLUMN IF NOT EXISTS body_scan_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS body_scan_ocr_pending BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS progress_photo_front_r2_key TEXT,
  ADD COLUMN IF NOT EXISTS progress_photo_front_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS progress_photo_side_r2_key TEXT,
  ADD COLUMN IF NOT EXISTS progress_photo_side_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS progress_photo_back_r2_key TEXT,
  ADD COLUMN IF NOT EXISTS progress_photo_back_at TIMESTAMPTZ;

COMMENT ON COLUMN public.member_profiles.bio IS 'Short public bio; enforce max 160 chars in app.';
COMMENT ON COLUMN public.member_profiles.experience_level IS 'beginner | intermediate | advanced | elite; null if unset.';
COMMENT ON COLUMN public.member_profiles.body_scan_r2_key IS 'Private R2 key for DEXA/InBody scan image; Worker GET /stack-photo?key=';
COMMENT ON COLUMN public.member_profiles.body_scan_ocr_pending IS 'True after upload until V2 OCR fills metrics.';
COMMENT ON COLUMN public.member_profiles.progress_photo_front_r2_key IS 'Private R2 key for front progress photo.';
COMMENT ON COLUMN public.member_profiles.progress_photo_side_r2_key IS 'Private R2 key for side progress photo.';
COMMENT ON COLUMN public.member_profiles.progress_photo_back_r2_key IS 'Private R2 key for back progress photo.';
