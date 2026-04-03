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

create table if not exists public.admin_monitoring_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  severity text not null default 'info',
  source text not null default 'system',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_command_history enable row level security;
alter table public.admin_monitoring_events enable row level security;

grant select, insert, update on public.admin_command_history to authenticated;
grant select, insert on public.admin_monitoring_events to authenticated;

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

create index if not exists admin_command_history_created_at_idx on public.admin_command_history(created_at desc);
create index if not exists admin_command_history_status_idx on public.admin_command_history(status);
create index if not exists admin_monitoring_events_created_at_idx on public.admin_monitoring_events(created_at desc);
create index if not exists admin_monitoring_events_event_type_idx on public.admin_monitoring_events(event_type);

notify pgrst, 'reload schema';
