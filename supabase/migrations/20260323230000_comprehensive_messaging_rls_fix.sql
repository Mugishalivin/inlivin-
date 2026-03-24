-- Complete fix for messaging system RLS policies
-- Drop all problematic policies and recreate them cleanly

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "allow_authenticated_to_create_conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "participants_can_view_conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "participants_can_update_conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;

-- Allow any authenticated user to create a conversation
CREATE POLICY "users_can_create_conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Users can only view conversations they're part of
CREATE POLICY "users_can_view_conversations" 
ON public.conversations 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = id
    AND cp.user_id = auth.uid()
  )
);

-- Users can update their own conversations
CREATE POLICY "users_can_update_conversations" 
ON public.conversations 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = id
    AND cp.user_id = auth.uid()
  )
);

-- ============================================
-- CONVERSATION_PARTICIPANTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Participants viewable by conversation members" ON public.conversation_participants;
DROP POLICY IF EXISTS "participants_viewable_by_conversation_members" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_participants;

-- Users can only see participants in their own conversations
CREATE POLICY "users_can_view_conversation_participants" 
ON public.conversation_participants 
FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid()
  OR conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE user_id = auth.uid()
  )
);

-- Users can add themselves OR be added if they're already a participant
CREATE POLICY "users_can_add_conversation_participants" 
ON public.conversation_participants 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Users can leave conversations
CREATE POLICY "users_can_leave_conversations" 
ON public.conversation_participants 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- ============================================
-- MESSAGES TABLE - SIMPLIFIED FOR BETTER PERFORMANCE
-- ============================================
DROP POLICY IF EXISTS "Messages viewable by conversation participants" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Users can view messages only if they're in the conversation
CREATE POLICY "users_can_view_messages" 
ON public.messages 
FOR SELECT 
TO authenticated 
USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE user_id = auth.uid()
  )
);

-- Users can insert messages only if they're in the conversation
CREATE POLICY "users_can_send_messages" 
ON public.messages 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = sender_id
  AND conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE user_id = auth.uid()
  )
);
