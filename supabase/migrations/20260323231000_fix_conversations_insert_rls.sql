-- Fix conversations table RLS - ensure permissive INSERT for all authenticated users
-- Drop ANY existing policies on conversations table first
DROP POLICY IF EXISTS "users_can_create_conversations" ON public.conversations;
DROP POLICY IF EXISTS "users_can_view_conversations" ON public.conversations;
DROP POLICY IF EXISTS "users_can_update_conversations" ON public.conversations;
DROP POLICY IF EXISTS "allow_authenticated_to_create_conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "participants_can_view_conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "participants_can_update_conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;

-- Ensure RLS is enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Allow ANY authenticated user to INSERT conversations with NO restrictions
-- The real access control is at conversation_participants table level
CREATE POLICY "allow_all_authenticated_insert" 
ON public.conversations 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow SELECT only if user is a participant
CREATE POLICY "select_only_own_conversations" 
ON public.conversations 
FOR SELECT 
TO authenticated 
USING (
  id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE user_id = auth.uid()
  )
);

-- Allow UPDATE only if user is a participant
CREATE POLICY "update_own_conversations" 
ON public.conversations 
FOR UPDATE 
TO authenticated 
USING (
  id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE user_id = auth.uid()
  )
);
