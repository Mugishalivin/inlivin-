-- Expand messaging with attachment metadata, per-user hides, and call sessions

-- Call sessions for real audio/video signaling and invite handling
create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  initiator_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'voice' check (mode in ('voice', 'video', 'emoji')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'active', 'rejected', 'ended')),
  offer_sdp text,
  answer_sdp text,
  caller_candidates jsonb not null default '[]'::jsonb,
  callee_candidates jsonb not null default '[]'::jsonb,
  burst_emojis text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz
);

alter table public.call_sessions enable row level security;

drop policy if exists "Call sessions viewable by participants" on public.call_sessions;
drop policy if exists "Call sessions insert by initiator" on public.call_sessions;
drop policy if exists "Call sessions update by participants" on public.call_sessions;
drop policy if exists "Call sessions delete by participants" on public.call_sessions;

create policy "Call sessions viewable by participants"
on public.call_sessions
for select
to authenticated
using (auth.uid() = initiator_id or auth.uid() = recipient_id);

create policy "Call sessions insert by initiator"
on public.call_sessions
for insert
to authenticated
with check (auth.uid() = initiator_id);

create policy "Call sessions update by participants"
on public.call_sessions
for update
to authenticated
using (auth.uid() = initiator_id or auth.uid() = recipient_id)
with check (auth.uid() = initiator_id or auth.uid() = recipient_id);

create policy "Call sessions delete by participants"
on public.call_sessions
for delete
to authenticated
using (auth.uid() = initiator_id or auth.uid() = recipient_id);

create index if not exists call_sessions_conversation_id_idx
on public.call_sessions(conversation_id);

create index if not exists call_sessions_recipient_status_idx
on public.call_sessions(recipient_id, status);

drop trigger if exists update_call_sessions_updated_at on public.call_sessions;
create trigger update_call_sessions_updated_at
before update on public.call_sessions
for each row
execute function public.update_updated_at_column();

-- Add richer message metadata
alter table public.messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime_type text,
  add column if not exists attachment_kind text not null default 'text',
  add column if not exists deleted_for_all boolean not null default false,
  add column if not exists call_session_id uuid references public.call_sessions(id) on delete set null;

create index if not exists messages_deleted_for_all_idx
on public.messages(deleted_for_all);

create index if not exists messages_call_session_id_idx
on public.messages(call_session_id);

-- Per-user message hiding
create table if not exists public.message_hidden (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.message_hidden enable row level security;

drop policy if exists "Hidden messages visible to owner" on public.message_hidden;
drop policy if exists "Hide own messages" on public.message_hidden;
drop policy if exists "Unhide own messages" on public.message_hidden;

create policy "Hidden messages visible to owner"
on public.message_hidden
for select
to authenticated
using (auth.uid() = user_id);

create policy "Hide own messages"
on public.message_hidden
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Unhide own messages"
on public.message_hidden
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists message_hidden_user_id_idx
on public.message_hidden(user_id);

create index if not exists message_hidden_message_id_idx
on public.message_hidden(message_id);

alter publication supabase_realtime add table public.call_sessions;
