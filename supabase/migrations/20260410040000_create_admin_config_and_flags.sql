-- Migration: Create admin tables with proper schema

BEGIN;

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS public.admin_global_config CASCADE;
DROP TABLE IF EXISTS public.feature_flags CASCADE;

-- Create admin_global_config table
CREATE TABLE public.admin_global_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Create feature_flags table
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_admin_global_config_key ON public.admin_global_config(config_key);
CREATE INDEX idx_feature_flags_key ON public.feature_flags(flag_key);
CREATE INDEX idx_feature_flags_enabled ON public.feature_flags(enabled);

-- Enable RLS
ALTER TABLE public.admin_global_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies (allow all authenticated users for now - restrict via app logic)
CREATE POLICY admin_global_config_all ON public.admin_global_config
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY feature_flags_all ON public.feature_flags
  FOR ALL USING (true) WITH CHECK (true);

-- Insert seed data
INSERT INTO public.admin_global_config (config_key, config_value, description)
VALUES
  ('system.ui', '{"theme": "dark", "compact_mode": false}', 'UI defaults'),
  ('security.rate_limit', '{"requests_per_minute": 100}', 'Rate limiting'),
  ('email.smtp', '{"enabled": false}', 'Email configuration'),
  ('admin_theme', '{"theme": "dark"}', 'Admin interface theme'),
  ('storage_config', '{"provider": "aws-s3", "bucket": "app-storage-prod", "region": "us-east-1"}', 'Storage configuration')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

INSERT INTO public.feature_flags (flag_key, name, description, enabled, rollout_percentage)
VALUES
  ('admin.experimental_dashboard', 'Experimental Dashboard', 'New admin UI layout', false, 0),
  ('user.ai_assist', 'AI Content Assistant', 'AI writing tools for users', true, 100),
  ('notifications.push', 'Push Notifications', 'Browser push support', false, 50),
  ('new_event_editor', 'New Event Editor', 'Redesigned event creation', true, 100),
  ('live_collaboration', 'Live Collaboration', 'Real-time multi-user editing', false, 25)
ON CONFLICT (flag_key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  rollout_percentage = EXCLUDED.rollout_percentage,
  updated_at = NOW();

COMMIT;
