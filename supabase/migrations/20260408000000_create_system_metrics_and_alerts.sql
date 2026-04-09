-- Migration: Create system metrics and alerts tables for admin system monitoring

BEGIN;

-- System Metrics Table (for storing historical metrics)
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp timestamptz DEFAULT NOW(),
  uptime_hours integer,
  active_users integer,
  database_size_mb integer,
  api_requests_24h integer,
  cache_hit_rate numeric(5,2),
  error_rate numeric(5,2),
  cpu_usage numeric(5,2),
  memory_usage numeric(5,2),
  disk_usage numeric(5,2),
  created_at timestamptz DEFAULT NOW()
);

-- System Alerts Table
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level text NOT NULL CHECK (level IN ('critical', 'warning', 'info')),
  title text NOT NULL,
  message text,
  source text,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- System Configuration Table (for storing system-wide settings)
CREATE TABLE IF NOT EXISTS public.system_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text UNIQUE NOT NULL,
  config_value jsonb DEFAULT '{}'::jsonb,
  description text,
  category text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);

-- Database Backup History Table
CREATE TABLE IF NOT EXISTS public.database_backups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_name text NOT NULL,
  backup_size integer,
  backup_path text,
  backup_type text NOT NULL CHECK (backup_type IN ('automatic', 'manual')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  retention_until timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW()
);

-- Performance Alerts Configuration Table
CREATE TABLE IF NOT EXISTS public.alert_thresholds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type text UNIQUE NOT NULL,
  threshold_value numeric(5,2),
  comparison_operator text CHECK (comparison_operator IN ('>', '<', '>=', '<=', '=')),
  is_enabled boolean DEFAULT true,
  notify_on_breach boolean DEFAULT true,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);

-- Notification Channels Configuration
CREATE TABLE IF NOT EXISTS public.notification_channels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_type text NOT NULL CHECK (channel_type IN ('email', 'webhook', 'in_app', 'sms')),
  channel_name text UNIQUE NOT NULL,
  configuration jsonb DEFAULT '{}'::jsonb,
  is_enabled boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  last_tested_at timestamptz,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_metrics_admin ON public.system_metrics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_alerts_admin ON public.system_alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_config_admin ON public.system_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

ALTER TABLE public.database_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY database_backups_admin ON public.database_backups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

ALTER TABLE public.alert_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY alert_thresholds_admin ON public.alert_thresholds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_channels_admin ON public.notification_channels
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Create indexes for better query performance
CREATE INDEX idx_system_metrics_timestamp ON public.system_metrics(timestamp DESC);
CREATE INDEX idx_system_alerts_created_at ON public.system_alerts(created_at DESC);
CREATE INDEX idx_system_alerts_resolved ON public.system_alerts(resolved);
CREATE INDEX idx_database_backups_created_at ON public.database_backups(created_at DESC);
CREATE INDEX idx_database_backups_status ON public.database_backups(status);

-- Seed alert thresholds
INSERT INTO public.alert_thresholds (alert_type, threshold_value, comparison_operator, description)
VALUES 
  ('cpu_usage', 80, '>', 'Alert when CPU usage exceeds 80%'),
  ('memory_usage', 85, '>', 'Alert when memory usage exceeds 85%'),
  ('disk_usage', 90, '>', 'Alert when disk usage exceeds 90%'),
  ('error_rate', 1, '>', 'Alert when error rate exceeds 1%'),
  ('cache_hit_rate', 70, '<', 'Alert when cache hit rate falls below 70%'),
  ('active_users', 0, '>', 'Track active users')
ON CONFLICT (alert_type) DO NOTHING;

-- Seed notification channels
INSERT INTO public.notification_channels (channel_type, channel_name, configuration, is_enabled)
VALUES 
  ('email', 'Admin Email Alerts', '{"email": "admin@platform.com"}', true),
  ('in_app', 'Dashboard Notifications', '{"dashboard": true}', true),
  ('webhook', 'Slack Integration', '{"webhook_url": "", "enabled": false}', false)
ON CONFLICT (channel_name) DO NOTHING;

COMMIT;
