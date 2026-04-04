-- Fix databases where PRIMARY KEY is on user_id (Postgres reports:
--   duplicate key violates unique constraint "user_stacks_pkey" Key (user_id)=(...)
-- Canonical PepGuideIQ: PRIMARY KEY (id); uniqueness per profile: (user_id, profile_id).

UPDATE public.user_stacks SET id = gen_random_uuid() WHERE id IS NULL;

ALTER TABLE public.user_stacks DROP CONSTRAINT IF EXISTS user_stacks_pkey;

ALTER TABLE public.user_stacks ADD CONSTRAINT user_stacks_pkey PRIMARY KEY (id);

ALTER TABLE public.user_stacks DROP CONSTRAINT IF EXISTS user_stacks_user_id_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'user_stacks'
      AND c.conname = 'user_stacks_user_profile_unique'
  ) THEN
    ALTER TABLE public.user_stacks
      ADD CONSTRAINT user_stacks_user_profile_unique UNIQUE (user_id, profile_id);
  END IF;
END $$;
