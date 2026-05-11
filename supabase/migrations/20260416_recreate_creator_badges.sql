-- Drop and recreate creator_badges table from scratch
-- This is needed if the table is in a corrupted state

-- First drop the table completely (this will also drop dependent RLS policies)
DROP TABLE IF EXISTS public.creator_badges CASCADE;

-- Now create it fresh with all required columns
CREATE TABLE public.creator_badges (
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

-- Enable RLS
ALTER TABLE public.creator_badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create indexes
CREATE INDEX idx_creator_badges_user_id ON public.creator_badges(user_id);
CREATE INDEX idx_creator_badges_badge_type ON public.creator_badges(badge_type);
CREATE INDEX idx_creator_badges_awarded_by ON public.creator_badges(awarded_by);
CREATE INDEX idx_creator_badges_awarded_at ON public.creator_badges(awarded_at);
CREATE INDEX idx_creator_badges_is_active ON public.creator_badges(is_active);
