-- Admin navigation and operations tables for dedicated admin pages.

create table if not exists public.admin_command_history (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  command_key text not null,
  command_label text not null,
  scope text not null default 'global',
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.admin_command_history enable row level security;

drop policy if exists "Admins can read command history" on public.admin_command_history;
drop policy if exists "Admins can insert command history" on public.admin_command_history;
drop policy if exists "Admins can update command history" on public.admin_command_history;

create policy "Admins can read command history"
  on public.admin_command_history for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert command history"
  on public.admin_command_history for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin') and actor_id = auth.uid());

create policy "Admins can update command history"
  on public.admin_command_history for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists admin_command_history_created_at_idx on public.admin_command_history(created_at desc);
create index if not exists admin_command_history_status_idx on public.admin_command_history(status);

create table if not exists public.admin_workflow_states (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  state text not null default 'pending',
  assigned_to uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  notes text,
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_workflow_states_entity_unique on public.admin_workflow_states(entity_type, entity_id);

alter table public.admin_workflow_states enable row level security;

drop policy if exists "Admins can read workflow states" on public.admin_workflow_states;
drop policy if exists "Admins can manage workflow states" on public.admin_workflow_states;

create policy "Admins can read workflow states"
  on public.admin_workflow_states for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage workflow states"
  on public.admin_workflow_states for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists admin_workflow_states_entity_idx on public.admin_workflow_states(entity_type, entity_id);
create index if not exists admin_workflow_states_state_idx on public.admin_workflow_states(state);

create table if not exists public.admin_alert_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  label text not null,
  description text,
  channel text not null default 'email',
  threshold_value numeric,
  comparison text not null default 'gte',
  enabled boolean not null default true,
  last_triggered_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.admin_alert_rules enable row level security;

drop policy if exists "Admins can read alert rules" on public.admin_alert_rules;
drop policy if exists "Admins can manage alert rules" on public.admin_alert_rules;

create policy "Admins can read alert rules"
  on public.admin_alert_rules for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage alert rules"
  on public.admin_alert_rules for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists admin_alert_rules_enabled_idx on public.admin_alert_rules(enabled);

create table if not exists public.admin_integrations (
  id uuid primary key default gen_random_uuid(),
  service_key text not null unique,
  label text not null,
  category text not null default 'analytics',
  status text not null default 'connected',
  endpoint text,
  last_sync_at timestamptz,
  health_score integer not null default 100,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.admin_integrations enable row level security;

drop policy if exists "Admins can read integrations" on public.admin_integrations;
drop policy if exists "Admins can manage integrations" on public.admin_integrations;

create policy "Admins can read integrations"
  on public.admin_integrations for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage integrations"
  on public.admin_integrations for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists admin_integrations_category_idx on public.admin_integrations(category);
create index if not exists admin_integrations_status_idx on public.admin_integrations(status);

create table if not exists public.admin_monitoring_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  severity text not null default 'info',
  source text not null default 'system',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_monitoring_events enable row level security;

drop policy if exists "Admins can read monitoring events" on public.admin_monitoring_events;
drop policy if exists "Admins can insert monitoring events" on public.admin_monitoring_events;

create policy "Admins can read monitoring events"
  on public.admin_monitoring_events for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert monitoring events"
  on public.admin_monitoring_events for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists admin_monitoring_events_created_at_idx on public.admin_monitoring_events(created_at desc);
create index if not exists admin_monitoring_events_event_type_idx on public.admin_monitoring_events(event_type);

insert into public.admin_feature_flags (flag_key, label, description, section, enabled, rollout_percent)
values
  ('admin_shell_v2', 'Admin shell v2', 'Expanded command center and navigation shell.', 'platform', true, 100),
  ('workflow_board', 'Workflow board', 'Content moves through pending, review, and shipped states.', 'content', true, 100),
  ('ops_console', 'Operations console', 'Maintenance commands and command history tracking.', 'operations', true, 100),
  ('monitoring_stream', 'Monitoring stream', 'Live events stream and health checks.', 'monitoring', true, 100),
  ('analytics_dash', 'Analytics dashboard', 'Charts and top lists for admin visibility.', 'analytics', true, 100)
on conflict (flag_key) do update
set label = excluded.label,
    description = excluded.description,
    section = excluded.section,
    enabled = excluded.enabled,
    rollout_percent = excluded.rollout_percent;

insert into public.admin_alert_rules (rule_key, label, description, channel, threshold_value, comparison, enabled)
values
  ('dau_drop', 'DAU drop alert', 'Warn when daily active users fall below a threshold.', 'email', 100, 'lte', true),
  ('session_failures', 'Session failures', 'Alert on call/session failures.', 'slack', 5, 'gte', true),
  ('content_backlog', 'Content backlog', 'Alert when pending workflow items pile up.', 'email', 25, 'gte', true)
on conflict (rule_key) do update
set label = excluded.label,
    description = excluded.description,
    channel = excluded.channel,
    threshold_value = excluded.threshold_value,
    comparison = excluded.comparison,
    enabled = excluded.enabled;

insert into public.admin_integrations (service_key, label, category, status, endpoint, health_score)
values
  ('mixpanel', 'Mixpanel', 'analytics', 'connected', 'https://mixpanel.com', 94),
  ('amplitude', 'Amplitude', 'analytics', 'connected', 'https://amplitude.com', 93),
  ('metabase', 'Metabase', 'bi', 'connected', 'https://metabase.com', 91),
  ('grafana', 'Grafana', 'monitoring', 'connected', 'https://grafana.com', 96),
  ('slack', 'Slack Alerts', 'alerts', 'connected', 'https://slack.com', 92)
on conflict (service_key) do update
set label = excluded.label,
    category = excluded.category,
    status = excluded.status,
    endpoint = excluded.endpoint,
    health_score = excluded.health_score;
