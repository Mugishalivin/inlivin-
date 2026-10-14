GRANT SELECT, INSERT, DELETE ON public.message_hidden TO authenticated;
GRANT ALL ON public.message_hidden TO service_role;
ALTER TABLE public.message_hidden ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own hidden messages" ON public.message_hidden;
DROP POLICY IF EXISTS "Users hide messages for themselves" ON public.message_hidden;
DROP POLICY IF EXISTS "Users unhide own messages" ON public.message_hidden;
CREATE POLICY "Users view own hidden messages" ON public.message_hidden FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users hide messages for themselves" ON public.message_hidden FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users unhide own messages" ON public.message_hidden FOR DELETE TO authenticated USING (user_id = auth.uid());