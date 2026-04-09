-- Migration: Create admin_settings table and fix schema

BEGIN;

-- Create admin_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- Create old_files table to track files for cleanup
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

-- Create system_performance_logs table for detailed metrics
CREATE TABLE IF NOT EXISTS public.system_performance_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type text NOT NULL,
  metric_value numeric,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW()
);

-- Create admin_audit_logs table
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

-- Create database_maintenance_logs table
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

-- Create scheduled_tasks table
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

-- Create rate_limit_logs table
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

-- Create api_usage_stats table
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

-- RLS Policies
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_settings_user ON public.admin_settings
  FOR ALL USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.old_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY old_files_admin ON public.old_files
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.system_performance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_performance_logs_admin ON public.system_performance_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_audit_logs_admin ON public.admin_audit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.database_maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY database_maintenance_logs_admin ON public.database_maintenance_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY scheduled_tasks_admin ON public.scheduled_tasks
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY rate_limit_logs_admin ON public.rate_limit_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE public.api_usage_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY api_usage_stats_admin ON public.api_usage_stats
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create indexes
CREATE INDEX idx_old_files_created_at ON public.old_files(created_at);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_maintenance_logs_status ON public.database_maintenance_logs(status);
CREATE INDEX idx_scheduled_tasks_next_run ON public.scheduled_tasks(next_run_at);

-- Seed sample old files
INSERT INTO public.old_files (file_name, file_path, file_size, created_at, last_accessed_at)
VALUES 
  ('temp-cache-2024.tmp', '/var/cache/temp-cache-2024.tmp', 524288000, NOW() - INTERVAL '180 days', NOW() - INTERVAL '160 days'),
  ('old-backup-jan.sql', '/backups/old-backup-jan.sql', 1073741824, NOW() - INTERVAL '90 days', NOW() - INTERVAL '85 days'),
  ('logs-2024-01.gz', '/logs/logs-2024-01.gz', 268435456, NOW() - INTERVAL '120 days', NOW() - INTERVAL '100 days')
ON CONFLICT DO NOTHING;

COMMIT;
