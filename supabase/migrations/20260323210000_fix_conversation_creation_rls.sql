-- Fix conversation creation - allow adding other participants if you're already a member
-- First, ensure we can create conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations FOR INSERT TO authenticated 
WITH CHECK (true);

-- Fix conversation_participants INSERT policy to allow two-step creation
-- Allow inserting yourself OR if you're already a participant in this conversation
DROP POLICY IF EXISTS "Users can add conversation participants" ON public.conversation_participants;
CREATE POLICY "Users can add conversation participants"
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
