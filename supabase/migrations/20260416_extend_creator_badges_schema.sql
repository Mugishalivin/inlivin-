-- Extend creator_badges table with admin badge management columns
-- This migration adds columns for tracking why badges were awarded, by whom, and when

-- First, ensure RLS is enabled on creator_badges
ALTER TABLE public.creator_badges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can award badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can update badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can remove badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Users can view all badges" ON public.creator_badges;

-- Add missing columns to creator_badges table
ALTER TABLE public.creator_badges
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS awarded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'achievement' CHECK (category IN ('achievement', 'verified', 'premium', 'special'));

-- Create RLS policies for public access and admin management
-- SELECT: Everyone can view all badges
CREATE POLICY "Anyone can view badges" ON public.creator_badges FOR SELECT USING (true);

-- INSERT: Only admins can award badges
CREATE POLICY "Admins can award badges" ON public.creator_badges FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- UPDATE: Only admins can update badges
CREATE POLICY "Admins can update badges" ON public.creator_badges FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- DELETE: Only admins can remove badges
CREATE POLICY "Admins can remove badges" ON public.creator_badges FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_badges_user_id ON public.creator_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_badges_badge_type ON public.creator_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_creator_badges_awarded_by ON public.creator_badges(awarded_by);
CREATE INDEX IF NOT EXISTS idx_creator_badges_awarded_at ON public.creator_badges(awarded_at);
CREATE INDEX IF NOT EXISTS idx_creator_badges_is_active ON public.creator_badges(is_active);
