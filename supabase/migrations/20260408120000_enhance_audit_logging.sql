-- Add severity and metadata columns to admin_audit_logs table for enhanced logging
ALTER TABLE public.admin_audit_logs
ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create index on severity for quick filtering of critical events
CREATE INDEX IF NOT EXISTS admin_audit_logs_severity_idx ON public.admin_audit_logs(severity DESC);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS admin_audit_logs_action_idx ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS admin_audit_logs_entity_type_idx ON public.admin_audit_logs(entity_type);

-- Create a view for recent high-severity events (useful for monitoring)
DROP VIEW IF EXISTS recent_high_severity_audits;
CREATE VIEW recent_high_severity_audits AS
SELECT 
  id,
  actor_id,
  action,
  entity_type,
  entity_id,
  severity,
  created_at
FROM admin_audit_logs
WHERE severity IN ('high', 'critical')
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;

-- Create table for admin reports/issues (required by badge metrics)
CREATE TABLE IF NOT EXISTS public.admin_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('user', 'content', 'other')),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_content_id text,
  description text NOT NULL,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes text,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.admin_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_reports
DROP POLICY IF EXISTS "Admins can read reports" ON public.admin_reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.admin_reports;

CREATE POLICY "Admins can read reports"
  ON public.admin_reports FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create reports"
  ON public.admin_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Create indexes for admin_reports
CREATE INDEX IF NOT EXISTS admin_reports_created_at_idx ON public.admin_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_reports_is_resolved_idx ON public.admin_reports(is_resolved);
CREATE INDEX IF NOT EXISTS admin_reports_report_type_idx ON public.admin_reports(report_type);

-- Create table for approval workflows (required by badge metrics)
CREATE TABLE IF NOT EXISTS public.admin_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.admin_approvals ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_approvals
DROP POLICY IF EXISTS "Admins can read approvals" ON public.admin_approvals;
DROP POLICY IF EXISTS "Admins can manage approvals" ON public.admin_approvals;

CREATE POLICY "Admins can read approvals"
  ON public.admin_approvals FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage approvals"
  ON public.admin_approvals FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create indexes for admin_approvals
CREATE INDEX IF NOT EXISTS admin_approvals_created_at_idx ON public.admin_approvals(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_approvals_status_idx ON public.admin_approvals(status);

-- Add is_banned and is_suspended columns to user_roles if they don't exist
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason text,
ADD COLUMN IF NOT EXISTS suspension_reason text,
ADD COLUMN IF NOT EXISTS banned_at timestamptz,
ADD COLUMN IF NOT EXISTS suspended_until timestamptz;

-- Create indexes for user status queries
CREATE INDEX IF NOT EXISTS user_roles_is_banned_idx ON public.user_roles(is_banned) WHERE is_banned = true;
CREATE INDEX IF NOT EXISTS user_roles_is_suspended_idx ON public.user_roles(is_suspended) WHERE is_suspended = true;

-- Create table for login attempts (for security tracking)
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for login_attempts
CREATE INDEX IF NOT EXISTS admin_login_attempts_created_at_idx ON public.admin_login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_login_attempts_success_idx ON public.admin_login_attempts(success);
