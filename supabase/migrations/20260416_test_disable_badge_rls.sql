-- Disable RLS on creator_badges to test badge awarding
-- If this works, the issue is RLS policies - reinstall proper policies after confirming it works

ALTER TABLE public.creator_badges DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Anyone can view badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can award badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can update badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can remove badges" ON public.creator_badges;
