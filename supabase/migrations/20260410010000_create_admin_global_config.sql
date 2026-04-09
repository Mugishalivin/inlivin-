-- Migration: Create global admin config tables for powerful settings page

BEGIN;

-- Global system settings (singleton)
CREATE TABLE IF NOT EXISTS public.admin_global_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);

-- Feature flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  enabled boolean DEFAULT false,
  rollout_percentage integer DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  conditions jsonb DEFAULT '{}',
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.admin_global_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_global_config_admin ON public.admin_global_config
  FOR ALL TO authenticated USING (true) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY feature_flags_admin ON public.feature_flags
  FOR ALL TO authenticated USING (true) WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Sample data
INSERT INTO public.admin_global_config (config_key, config_value, description, updated_by)
VALUES 
  ('system.ui', '{"theme": "dark", "compact_mode": false}'::jsonb, 'UI defaults', gen_random_uuid()),
  ('security.rate_limit', '{"requests_per_minute": 100}'::jsonb, 'Rate limiting', gen_random_uuid()),
  ('email.smtp', '{"enabled": false}'::jsonb, 'Email config', gen_random_uuid())
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO public.feature_flags (flag_key, name, description, enabled, rollout_percentage)
VALUES 
  ('admin.experimental_dashboard', 'Experimental Dashboard', 'New admin UI layout', false, 0),
  ('user.ai_assist', 'AI Content Assistant', 'AI writing tools for users', true, 100),
  ('notifications.push', 'Push Notifications', 'Browser push support', false, 50)
ON CONFLICT (flag_key) DO NOTHING;

COMMIT;

