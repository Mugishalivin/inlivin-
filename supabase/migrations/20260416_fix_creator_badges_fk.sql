-- Fix creator_badges foreign key constraint
-- Change from referencing auth.users(id) to profiles(id)
-- This fixes the issue where profiles have users not in auth.users

-- Drop the existing foreign key constraint
ALTER TABLE public.creator_badges
DROP CONSTRAINT IF EXISTS creator_badges_user_id_fkey;

-- Add new foreign key constraint referencing profiles table instead
ALTER TABLE public.creator_badges
ADD CONSTRAINT creator_badges_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Also fix awarded_by constraint if it exists
ALTER TABLE public.creator_badges
DROP CONSTRAINT IF EXISTS creator_badges_awarded_by_fkey;

-- Add new constraint for awarded_by (the admin who awarded it) - this can reference auth.users
ALTER TABLE public.creator_badges
ADD CONSTRAINT creator_badges_awarded_by_fkey 
  FOREIGN KEY (awarded_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Re-enable RLS with proper policies
ALTER TABLE public.creator_badges ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can award badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can update badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can remove badges" ON public.creator_badges;

-- Create new RLS policies
CREATE POLICY "Anyone can view badges" ON public.creator_badges FOR SELECT USING (true);

CREATE POLICY "Admins can award badges" ON public.creator_badges FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

CREATE POLICY "Admins can update badges" ON public.creator_badges FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

CREATE POLICY "Admins can remove badges" ON public.creator_badges FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));
