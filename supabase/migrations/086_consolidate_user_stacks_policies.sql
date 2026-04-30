-- Remove duplicate legacy policies on user_stacks
-- Keeping the newer named policies, dropping the old ones

DROP POLICY IF EXISTS "Users can read own stack" ON public.user_stacks;
DROP POLICY IF EXISTS "Users can upsert own stack" ON public.user_stacks;
DROP POLICY IF EXISTS "Users can update own stack" ON public.user_stacks;
