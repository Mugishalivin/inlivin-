-- Allow message senders to delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Allow message senders to edit their own messages
CREATE POLICY "Users can edit own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id);
