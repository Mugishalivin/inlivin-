-- Fix conversation_participants INSERT policy - the old policy only allowed user_id = auth.uid()
-- which breaks when creating a conversation (need to insert participant for the other user too)
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;

-- New policy: allow inserting if you are the user being added, OR if you already are a participant in that conversation
CREATE POLICY "Users can add conversation participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.is_conversation_member(auth.uid(), conversation_id)
);