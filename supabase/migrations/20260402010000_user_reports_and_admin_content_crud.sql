-- User reports and admin content workflow.

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  reason text not null,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  admin_action text,
  admin_notes text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_reports enable row level security;

drop policy if exists "Users can create reports" on public.user_reports;
drop policy if exists "Users can read own reports" on public.user_reports;
drop policy if exists "Admins can read reports" on public.user_reports;
drop policy if exists "Admins can manage reports" on public.user_reports;

create policy "Users can create reports"
  on public.user_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "Users can read own reports"
  on public.user_reports for select
  to authenticated
  using (reporter_id = auth.uid());

create policy "Admins can read reports"
  on public.user_reports for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage reports"
  on public.user_reports for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists user_reports_created_at_idx on public.user_reports(created_at desc);
create index if not exists user_reports_status_idx on public.user_reports(status);
create index if not exists user_reports_entity_idx on public.user_reports(entity_type, entity_id);
create index if not exists user_reports_reported_user_idx on public.user_reports(reported_user_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'update_user_reports_updated_at'
  ) then
    create trigger update_user_reports_updated_at
    before update on public.user_reports
    for each row execute function public.update_updated_at_column();
  end if;
end
$$;

insert into public.admin_feature_flags (flag_key, label, description, section, enabled, rollout_percent)
values
  ('user_reports', 'User reports', 'Workflow for user-submitted reports and resolution actions.', 'moderation', true, 100),
  ('admin_content_crud', 'Admin content CRUD', 'Create, edit, publish, and unpublish announcements, promotions, and ads.', 'content', true, 100)
on conflict (flag_key) do update
set label = excluded.label,
    description = excluded.description,
    section = excluded.section,
    enabled = excluded.enabled,
    rollout_percent = excluded.rollout_percent;
