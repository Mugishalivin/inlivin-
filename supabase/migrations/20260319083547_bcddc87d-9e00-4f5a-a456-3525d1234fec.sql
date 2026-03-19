
-- Fix overly permissive policies
DROP POLICY "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY "System can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications for others" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() != user_id);
CREATE POLICY "Users can create own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
