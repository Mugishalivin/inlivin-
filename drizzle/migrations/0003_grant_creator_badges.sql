GRANT SELECT ON public.creator_badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_badges TO authenticated;
GRANT ALL ON public.creator_badges TO service_role;
DROP POLICY IF EXISTS "Admins can award badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can insert badges" ON public.creator_badges;
CREATE POLICY "Admins can insert badges" ON public.creator_badges FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));