-- Expand admin operations with audit logs, feature flags, impersonation sessions, and profile status.

alter table public.profiles
  add column if not exists status text not null default 'active';

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  actor_role text not null default 'admin',
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
drop policy if exists "Admins can insert audit logs" on public.admin_audit_logs;

create policy "Admins can read audit logs"
  on public.admin_audit_logs for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert audit logs"
  on public.admin_audit_logs for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin') and actor_id = auth.uid());

create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);
create index if not exists admin_audit_logs_actor_id_idx on public.admin_audit_logs(actor_id);

create table if not exists public.admin_feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null unique,
  label text not null,
  description text,
  section text not null default 'general',
  enabled boolean not null default false,
  rollout_percent integer not null default 100,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.admin_feature_flags enable row level security;

drop policy if exists "Admins can manage feature flags" on public.admin_feature_flags;
drop policy if exists "Authenticated users can view feature flags" on public.admin_feature_flags;

create policy "Authenticated users can view feature flags"
  on public.admin_feature_flags for select
  to authenticated
  using (true);

create policy "Admins can manage feature flags"
  on public.admin_feature_flags for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'update_admin_feature_flags_updated_at'
  ) then
    create trigger update_admin_feature_flags_updated_at
    before update on public.admin_feature_flags
    for each row execute function public.update_updated_at_column();
  end if;
end
$$;

create table if not exists public.admin_impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  is_active boolean not null default true,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table public.admin_impersonation_sessions enable row level security;

drop policy if exists "Admins can view impersonation sessions" on public.admin_impersonation_sessions;
drop policy if exists "Admins can create impersonation sessions" on public.admin_impersonation_sessions;
drop policy if exists "Admins can update impersonation sessions" on public.admin_impersonation_sessions;

create policy "Admins can view impersonation sessions"
  on public.admin_impersonation_sessions for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can create impersonation sessions"
  on public.admin_impersonation_sessions for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin') and admin_id = auth.uid());

create policy "Admins can update impersonation sessions"
  on public.admin_impersonation_sessions for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists admin_impersonation_sessions_active_idx on public.admin_impersonation_sessions(is_active);
create index if not exists admin_impersonation_sessions_target_idx on public.admin_impersonation_sessions(target_user_id);
