-- Add view once (ephemeral) message support
alter table public.messages
  add column if not exists is_view_once boolean not null default false,
  add column if not exists view_once_viewed_by uuid[] default array[]::uuid[];

-- Add message scheduled send
alter table public.messages
  add column if not exists scheduled_at timestamptz,
  add column if not exists is_scheduled boolean not null default false;

-- Create message read tracking (for view once)
create table if not exists public.message_views (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.message_views enable row level security;

create policy "Users can view message views"
on public.message_views
for select
to authenticated
using (
  exists (
    select 1
    from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_views.message_id
      and cp.user_id = auth.uid()
  )
);

create policy "Users can insert own message views"
on public.message_views
for insert
to authenticated
with check (auth.uid() = user_id);

-- Create index for efficient lookups
create index if not exists message_views_message_id_idx on public.message_views(message_id);
create index if not exists message_views_user_id_idx on public.message_views(user_id);
