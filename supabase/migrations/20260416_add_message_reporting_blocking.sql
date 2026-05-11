-- Create message reporting and blocking system
create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  reported_by uuid not null references auth.users(id) on delete cascade,
  reported_user uuid not null references auth.users(id) on delete cascade,
  reason text not null, -- harassment, spam, inappropriate, other
  description text,
  status text not null default 'pending', -- pending, reviewed, resolved, dismissed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(message_id, reported_by)
);

alter table public.message_reports enable row level security;

create policy "Users can report messages"
on public.message_reports
for insert
to authenticated
with check (auth.uid() = reported_by);

create policy "Users can view own reports"
on public.message_reports
for select
to authenticated
using (auth.uid() = reported_by);

-- Create user blocking system
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(blocker_id, blocked_id)
);

alter table public.user_blocks enable row level security;

create policy "Users can view own blocks"
on public.user_blocks
for select
to authenticated
using (auth.uid() = blocker_id);

create policy "Users can block other users"
on public.user_blocks
for insert
to authenticated
with check (auth.uid() = blocker_id);

create policy "Users can unblock"
on public.user_blocks
for delete
to authenticated
using (auth.uid() = blocker_id);

-- Create indexes
create index if not exists message_reports_message_id_idx on public.message_reports(message_id);
create index if not exists message_reports_reported_by_idx on public.message_reports(reported_by);
create index if not exists message_reports_status_idx on public.message_reports(status);
create index if not exists user_blocks_blocker_idx on public.user_blocks(blocker_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);
