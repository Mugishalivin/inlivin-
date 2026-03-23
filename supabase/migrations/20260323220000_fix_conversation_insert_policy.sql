-- Drop existing INSERT policies on conversations and recreate with simpler logic
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;

-- Allow any authenticated user to create a conversation (no columns to check, just allow it)
CREATE POLICY "allow_authenticated_to_create_conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Ensure SELECT and UPDATE policies work correctly
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "participants_can_view_conversations" 
ON public.conversations 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = id 
    AND user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "participants_can_update_conversations" 
ON public.conversations 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = id 
    AND user_id = auth.uid()
  )
);
