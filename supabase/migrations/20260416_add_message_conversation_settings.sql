-- Add message and conversation settings
alter table public.conversation_participants
  add column if not exists notification_setting text not null default 'all', -- all, mentions, muted
  add column if not exists disappearing_messages_duration int default null, -- in seconds, null = disabled
  add column if not exists show_timestamps boolean not null default true,
  add column if not exists show_read_receipts boolean not null default true,
  add column if not exists block_all_media boolean not null default false,
  add column if not exists custom_color text;

-- Create conversation group settings
alter table public.conversations
  add column if not exists group_description text,
  add column if not exists group_icon_url text,
  add column if not exists allow_members_add boolean not null default true,
  add column if not exists only_admins_send boolean not null default false,
  add column if not exists encryption_enabled boolean not null default false;

-- Track disappearing messages (auto-delete after viewed)
create table if not exists public.disappearing_messages (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  viewed_at timestamptz,
  primary key (message_id, user_id)
);

alter table public.disappearing_messages enable row level security;

create policy "Users can manage their disappearing messages"
on public.disappearing_messages
for all
to authenticated
using (
  exists (
    select 1
    from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = disappearing_messages.message_id
      and cp.user_id = auth.uid()
  )
);

-- Create conversation settings history/audit
create table if not exists public.conversation_audit_log (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null, -- member_added, member_removed, admin_changed, settings_updated, etc
  target_user_id uuid references auth.users(id) on delete set null,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.conversation_audit_log enable row level security;

create policy "Users can view conversation audit logs"
on public.conversation_audit_log
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = conversation_audit_log.conversation_id
      and cp.user_id = auth.uid()
  )
);

-- Create indexes
create index if not exists conversation_participants_notification_idx on public.conversation_participants(user_id, notification_setting);
create index if not exists disappearing_messages_expires_at_idx on public.disappearing_messages(expires_at);
create index if not exists conversation_audit_log_conversation_id_idx on public.conversation_audit_log(conversation_id);
create index if not exists conversation_audit_log_actor_id_idx on public.conversation_audit_log(actor_id);
