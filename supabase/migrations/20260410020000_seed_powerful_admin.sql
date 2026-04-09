-- Seed data for Powerful Admin Settings
-- Run this in Supabase SQL Editor after migrations

CREATE TABLE IF NOT EXISTS public.admin_global_config (
  config_key TEXT PRIMARY KEY,
  config_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feature_flags (
  flag_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS with admin access
ALTER TABLE public.admin_global_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to global config" ON public.admin_global_config 
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access to feature flags" ON public.feature_flags 
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed global configs
INSERT INTO public.admin_global_config (config_key, config_value, description) VALUES
('system.ui', '{"theme": "system", "density": "comfortable", "animations": true}', 'Global UI configuration'),
('security.rate_limit', '{"requests_per_minute": 100, "burst": 10, "rls_strict": true}', 'Rate limiting & security'),
('features.core', '{"ai_assist": true, "live_chat": true, "analytics": true}', 'Core feature toggles'),
('system.cache', '{"ttl_seconds": 3600, "max_size_mb": 512}', 'Caching configuration'),
('integrations.smtp', '{"enabled": false, "host": "smtp.sendgrid.net"}', 'Email integration')
ON CONFLICT (config_key) DO UPDATE SET 
  config_value = EXCLUDED.config_value, 
  updated_at = now();

-- Seed feature flags
INSERT INTO public.feature_flags (flag_key, name, description, enabled, rollout_percentage) VALUES
('new_event_editor', 'New Event Editor', 'Redesigned event creation with AI suggestions', true, 100),
('live_collaboration', 'Live Collaboration', 'Real-time multi-user project editing', false, 25),
('advanced_analytics', 'AI Analytics', 'Machine learning powered user insights', true, 50),
('beta_mobile_app', 'Beta Mobile Features', 'Test new mobile optimizations', false, 10),
('ab_testing_framework', 'A/B Testing', 'Full experimentation platform', true, 100)
ON CONFLICT (flag_key) DO UPDATE SET 
  enabled = EXCLUDED.enabled,
  rollout_percentage = EXCLUDED.rollout_percentage,
  updated_at = now();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_global_config_updated ON public.admin_global_config(updated_at);
