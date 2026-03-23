
-- Create security definer function to check conversation membership without recursion
CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- Drop the old recursive SELECT policy
DROP POLICY IF EXISTS "Participants viewable by conversation members" ON public.conversation_participants;

-- Create new non-recursive SELECT policy
CREATE POLICY "Participants viewable by conversation members"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_conversation_member(auth.uid(), conversation_id)
);
