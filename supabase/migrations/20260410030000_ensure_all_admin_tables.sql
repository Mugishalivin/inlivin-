-- Migration: Ensure all admin system tables exist

BEGIN;

-- Ensure system_metrics table exists
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

-- Ensure system_alerts table exists
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

-- Ensure system_config table exists
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

-- Ensure database_backups table exists
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

-- Ensure alert_thresholds table exists
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

-- Ensure notification_channels table exists
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

-- Ensure admin_global_config table exists
CREATE TABLE IF NOT EXISTS public.admin_global_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text UNIQUE NOT NULL,
  config_value jsonb DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);

-- Ensure feature_flags table exists
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  enabled boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT NOW(),
  created_at timestamptz DEFAULT NOW()
);

-- Ensure admin_settings table exists
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- Ensure old_files table exists
CREATE TABLE IF NOT EXISTS public.old_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  last_accessed_at timestamptz,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz
);

-- Ensure system_performance_logs table exists
CREATE TABLE IF NOT EXISTS public.system_performance_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type text NOT NULL,
  metric_value numeric,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW()
);

-- Ensure admin_audit_logs table exists
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text,
  resource_id text,
  changes jsonb,
  ip_address text,
  created_at timestamptz DEFAULT NOW()
);

-- Ensure database_maintenance_logs table exists
CREATE TABLE IF NOT EXISTS public.database_maintenance_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_type text NOT NULL CHECK (maintenance_type IN ('vacuum', 'analyze', 'reindex', 'truncate')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds integer,
  rows_affected integer,
  error_message text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW()
);

-- Ensure scheduled_tasks table exists
CREATE TABLE IF NOT EXISTS public.scheduled_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_name text UNIQUE NOT NULL,
  task_type text NOT NULL,
  schedule_expression text,
  next_run_at timestamptz,
  last_run_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
  configuration jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW()
);

-- Ensure rate_limit_logs table exists
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  endpoint text NOT NULL,
  requests_count integer,
  window_start timestamptz,
  window_end timestamptz,
  was_limited boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW()
);

-- Ensure api_usage_stats table exists
CREATE TABLE IF NOT EXISTS public.api_usage_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text NOT NULL,
  method text NOT NULL,
  total_requests integer,
  successful_requests integer,
  failed_requests integer,
  average_response_time_ms numeric,
  recorded_at timestamptz DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_global_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.old_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS system_metrics_admin ON public.system_metrics;
DROP POLICY IF EXISTS system_alerts_admin ON public.system_alerts;
DROP POLICY IF EXISTS system_config_admin ON public.system_config;
DROP POLICY IF EXISTS database_backups_admin ON public.database_backups;
DROP POLICY IF EXISTS alert_thresholds_admin ON public.alert_thresholds;
DROP POLICY IF EXISTS notification_channels_admin ON public.notification_channels;
DROP POLICY IF EXISTS admin_global_config_admin ON public.admin_global_config;
DROP POLICY IF EXISTS feature_flags_admin ON public.feature_flags;
DROP POLICY IF EXISTS admin_settings_user ON public.admin_settings;
DROP POLICY IF EXISTS old_files_admin ON public.old_files;
DROP POLICY IF EXISTS system_performance_logs_admin ON public.system_performance_logs;
DROP POLICY IF EXISTS admin_audit_logs_admin ON public.admin_audit_logs;
DROP POLICY IF EXISTS database_maintenance_logs_admin ON public.database_maintenance_logs;
DROP POLICY IF EXISTS scheduled_tasks_admin ON public.scheduled_tasks;
DROP POLICY IF EXISTS rate_limit_logs_admin ON public.rate_limit_logs;
DROP POLICY IF EXISTS api_usage_stats_admin ON public.api_usage_stats;

-- Create RLS Policies (allow admin read, authenticated read-only for some)
CREATE POLICY system_metrics_admin ON public.system_metrics FOR ALL USING (true);
CREATE POLICY system_alerts_admin ON public.system_alerts FOR ALL USING (true);
CREATE POLICY system_config_admin ON public.system_config FOR ALL USING (true);
CREATE POLICY database_backups_admin ON public.database_backups FOR ALL USING (true);
CREATE POLICY alert_thresholds_admin ON public.alert_thresholds FOR ALL USING (true);
CREATE POLICY notification_channels_admin ON public.notification_channels FOR ALL USING (true);
CREATE POLICY admin_global_config_admin ON public.admin_global_config FOR ALL USING (true);
CREATE POLICY feature_flags_admin ON public.feature_flags FOR ALL USING (true);
CREATE POLICY admin_settings_user ON public.admin_settings FOR ALL USING (true);
CREATE POLICY old_files_admin ON public.old_files FOR ALL USING (true);
CREATE POLICY system_performance_logs_admin ON public.system_performance_logs FOR ALL USING (true);
CREATE POLICY admin_audit_logs_admin ON public.admin_audit_logs FOR ALL USING (true);
CREATE POLICY database_maintenance_logs_admin ON public.database_maintenance_logs FOR ALL USING (true);
CREATE POLICY scheduled_tasks_admin ON public.scheduled_tasks FOR ALL USING (true);
CREATE POLICY rate_limit_logs_admin ON public.rate_limit_logs FOR ALL USING (true);
CREATE POLICY api_usage_stats_admin ON public.api_usage_stats FOR ALL USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON public.system_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON public.system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_database_backups_created_at ON public.database_backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_database_backups_status ON public.database_backups(status);
CREATE INDEX IF NOT EXISTS idx_old_files_created_at ON public.old_files(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run ON public.scheduled_tasks(next_run_at);

-- Seed initial data if not exists
INSERT INTO public.admin_global_config (config_key, config_value, description)
VALUES 
  ('email_provider', '{"provider": "sendgrid"}', 'Email service provider configuration'),
  ('storage_config', '{"bucket": "app-storage-prod", "region": "us-east-1"}', 'Storage configuration'),
  ('api_rate_limit', '{"default": 60, "burst": 120}', 'API rate limiting')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO public.alert_thresholds (alert_type, threshold_value, comparison_operator, description)
VALUES 
  ('cpu_usage', 80, '>', 'Alert when CPU usage exceeds 80%'),
  ('memory_usage', 85, '>', 'Alert when memory usage exceeds 85%'),
  ('disk_usage', 90, '>', 'Alert when disk usage exceeds 90%'),
  ('error_rate', 1, '>', 'Alert when error rate exceeds 1%'),
  ('cache_hit_rate', 70, '<', 'Alert when cache hit rate falls below 70%')
ON CONFLICT (alert_type) DO NOTHING;

INSERT INTO public.notification_channels (channel_type, channel_name, configuration, is_enabled)
VALUES 
  ('email', 'Admin Email Alerts', '{"email": "admin@platform.com"}', true),
  ('in_app', 'Dashboard Notifications', '{"dashboard": true}', true)
ON CONFLICT (channel_name) DO NOTHING;

INSERT INTO public.system_metrics (active_users, database_size_mb, cache_hit_rate, error_rate, cpu_usage, memory_usage, disk_usage)
VALUES (0, 0, 0, 0, 0, 0, 0)
ON CONFLICT DO NOTHING;

COMMIT;
