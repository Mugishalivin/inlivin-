ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS scheduled_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS cta_label text;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS cta_url text;
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
CREATE POLICY "Live announcements are viewable" ON public.announcements FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR (is_active AND scheduled_at <= now() AND (expires_at IS NULL OR expires_at > now())));