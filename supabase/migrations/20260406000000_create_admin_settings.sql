-- Create admin_settings table for storing admin-specific preferences

CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_view TEXT NOT NULL DEFAULT 'overview',
  refresh_interval INTEGER NOT NULL DEFAULT 60,
  compact_mode BOOLEAN NOT NULL DEFAULT false,
  show_empty_hints BOOLEAN NOT NULL DEFAULT true,
  confirm_delete BOOLEAN NOT NULL DEFAULT true,
  verbose_logging BOOLEAN NOT NULL DEFAULT false,
  always_show_icons BOOLEAN NOT NULL DEFAULT true,
  compact_sidebar BOOLEAN NOT NULL DEFAULT false,
  desktop_notifications BOOLEAN NOT NULL DEFAULT true,
  critical_alerts_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view and update their own settings
CREATE POLICY "Admins can manage their own settings"
  ON public.admin_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

-- Create trigger to auto-update updated_at column
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.admin_settings TO authenticated;
