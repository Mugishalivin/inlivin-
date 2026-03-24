-- Persistent user settings for the dashboard/settings center.

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_mode TEXT NOT NULL DEFAULT 'system',
  profile_visibility TEXT NOT NULL DEFAULT 'public',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  allow_messages BOOLEAN NOT NULL DEFAULT true,
  show_location BOOLEAN NOT NULL DEFAULT true,
  compact_mode BOOLEAN NOT NULL DEFAULT false,
  autoplay_media BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User settings are viewable by owner" ON public.user_settings;
DROP POLICY IF EXISTS "User settings are insertable by owner" ON public.user_settings;
DROP POLICY IF EXISTS "User settings are updatable by owner" ON public.user_settings;
DROP POLICY IF EXISTS "User settings are deletable by owner" ON public.user_settings;

CREATE POLICY "User settings are viewable by owner"
  ON public.user_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "User settings are insertable by owner"
  ON public.user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "User settings are updatable by owner"
  ON public.user_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "User settings are deletable by owner"
  ON public.user_settings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;
