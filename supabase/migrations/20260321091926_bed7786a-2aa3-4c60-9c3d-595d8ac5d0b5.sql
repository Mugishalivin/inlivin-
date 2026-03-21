
-- Fix infinite recursion in conversation_participants SELECT policy
-- The bug: policy references conversation_participants within itself
DROP POLICY IF EXISTS "Participants viewable by conversation members" ON public.conversation_participants;
CREATE POLICY "Participants viewable by conversation members" ON public.conversation_participants
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  conversation_id IN (
    SELECT cp2.conversation_id FROM public.conversation_participants cp2 WHERE cp2.user_id = auth.uid()
  )
);

-- Fix conversations SELECT/UPDATE policies (same recursion issue)
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations" ON public.conversations
FOR SELECT TO authenticated
USING (
  id IN (SELECT cp.conversation_id FROM public.conversation_participants cp WHERE cp.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations
FOR UPDATE TO authenticated
USING (
  id IN (SELECT cp.conversation_id FROM public.conversation_participants cp WHERE cp.user_id = auth.uid())
);

-- Allow deleting own conversation_participants (for leaving conversations)
CREATE POLICY "Users can leave conversations" ON public.conversation_participants
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Allow deleting own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
