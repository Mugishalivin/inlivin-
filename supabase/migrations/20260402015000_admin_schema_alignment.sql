-- Align admin tables with the columns used by the app.

alter table public.admin_command_history
add column if not exists command_key text not null default 'manual';

alter table public.admin_command_history
add column if not exists command_label text not null default 'Manual command';

alter table public.admin_command_history
add column if not exists scope text not null default 'global';

alter table public.admin_command_history
add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.admin_command_history
add column if not exists result jsonb not null default '{}'::jsonb;

alter table public.admin_command_history
add column if not exists completed_at timestamptz;

alter table public.admin_command_history
add column if not exists status text not null default 'queued';

alter table public.admin_workflow_states
add column if not exists entity_type text;

alter table public.admin_workflow_states
add column if not exists entity_id text;

alter table public.admin_workflow_states
add column if not exists state text not null default 'pending';

alter table public.admin_workflow_states
add column if not exists assigned_to uuid references auth.users(id) on delete set null;

alter table public.admin_workflow_states
add column if not exists updated_by uuid references auth.users(id) on delete set null;

alter table public.admin_workflow_states
add column if not exists notes text;

alter table public.admin_workflow_states
add column if not exists updated_at timestamptz not null default now();

alter table public.admin_alert_rules
add column if not exists rule_key text;

alter table public.admin_alert_rules
add column if not exists label text;

alter table public.admin_alert_rules
add column if not exists description text;

alter table public.admin_alert_rules
add column if not exists channel text not null default 'email';

alter table public.admin_alert_rules
add column if not exists threshold_value numeric;

alter table public.admin_alert_rules
add column if not exists comparison text not null default 'gte';

alter table public.admin_alert_rules
add column if not exists enabled boolean not null default true;

alter table public.admin_alert_rules
add column if not exists last_triggered_at timestamptz;

alter table public.admin_alert_rules
add column if not exists updated_by uuid references auth.users(id) on delete set null;

alter table public.admin_alert_rules
add column if not exists updated_at timestamptz not null default now();

alter table public.admin_integrations
add column if not exists service_key text;

alter table public.admin_integrations
add column if not exists label text;

alter table public.admin_integrations
add column if not exists category text not null default 'analytics';

alter table public.admin_integrations
add column if not exists status text not null default 'connected';

alter table public.admin_integrations
add column if not exists endpoint text;

alter table public.admin_integrations
add column if not exists last_sync_at timestamptz;

alter table public.admin_integrations
add column if not exists health_score integer not null default 100;

alter table public.admin_integrations
add column if not exists updated_by uuid references auth.users(id) on delete set null;

alter table public.admin_integrations
add column if not exists updated_at timestamptz not null default now();

alter table public.admin_monitoring_events
add column if not exists source text not null default 'system';

alter table public.admin_monitoring_events
add column if not exists message text not null default '';

alter table public.admin_monitoring_events
add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.admin_monitoring_events
add column if not exists severity text not null default 'info';

alter table public.user_reports
add column if not exists admin_action text;

alter table public.user_reports
add column if not exists admin_notes text;

alter table public.user_reports
add column if not exists status text not null default 'open';

alter table public.user_reports
add column if not exists resolved_by uuid references auth.users(id) on delete set null;

alter table public.user_reports
add column if not exists resolved_at timestamptz;

alter table public.profiles
add column if not exists status text not null default 'active';

alter table public.announcements
add column if not exists media_url text;

alter table public.announcements
add column if not exists media_type text;

alter table public.promotions
add column if not exists media_url text;

alter table public.promotions
add column if not exists media_type text;

alter table public.ads
add column if not exists media_url text;

alter table public.ads
add column if not exists media_type text;
