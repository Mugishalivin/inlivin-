-- Robust creator_badges schema fix - recreate table if needed
-- This handles the case where the table might be missing the user_id column

-- Check if table exists, if not create it fresh
CREATE TABLE IF NOT EXISTS public.creator_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('verified', 'top_collaborator', 'trending_creator', 'consistent_contributor', 'community_helper', 'master_craftsman', 'rising_star')),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT,
  awarded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'achievement' CHECK (category IN ('achievement', 'verified', 'premium', 'special')),
  UNIQUE(user_id, badge_type)
);

-- Enable RLS if not already enabled
ALTER TABLE public.creator_badges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can award badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can update badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can remove badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Users can view all badges" ON public.creator_badges;

-- Create RLS policies
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
