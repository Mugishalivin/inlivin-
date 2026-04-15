-- Persist WhatsApp-style messaging state such as reactions, stars, mute/archive, and read position.

alter table public.conversation_participants
  add column if not exists is_muted boolean not null default false,
  add column if not exists is_archived boolean not null default false,
  add column if not exists last_read_at timestamptz,
  add column if not exists last_read_message_id uuid references public.messages(id) on delete set null,
  add column if not exists is_admin boolean not null default false;

create index if not exists conversation_participants_user_archive_idx
on public.conversation_participants(user_id, is_archived);

create index if not exists conversation_participants_user_muted_idx
on public.conversation_participants(user_id, is_muted);

create index if not exists conversation_participants_last_read_idx
on public.conversation_participants(conversation_id, last_read_at desc);

drop policy if exists "Users can update own conversation participant state" on public.conversation_participants;

create policy "Users can update own conversation participant state"
on public.conversation_participants
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

alter table public.messages
  add column if not exists edited_at timestamptz,
  add column if not exists reply_to_message_id uuid references public.messages(id) on delete set null;

create index if not exists messages_reply_to_message_id_idx
on public.messages(reply_to_message_id);

drop policy if exists "Users can update own messages" on public.messages;

create policy "Users can update own messages"
on public.messages
for update
to authenticated
using (
  auth.uid() = sender_id
  and conversation_id in (
    select conversation_id
    from public.conversation_participants
    where user_id = auth.uid()
  )
)
with check (
  auth.uid() = sender_id
  and conversation_id in (
    select conversation_id
    from public.conversation_participants
    where user_id = auth.uid()
  )
);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.message_reactions enable row level security;

drop policy if exists "Users can view message reactions" on public.message_reactions;
drop policy if exists "Users can react to messages" on public.message_reactions;
drop policy if exists "Users can remove own reactions" on public.message_reactions;

create policy "Users can view message reactions"
on public.message_reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_reactions.message_id
      and cp.user_id = auth.uid()
  )
);

create policy "Users can react to messages"
on public.message_reactions
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_reactions.message_id
      and cp.user_id = auth.uid()
  )
);

create policy "Users can update own reactions"
on public.message_reactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can remove own reactions"
on public.message_reactions
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.message_stars (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.message_stars enable row level security;

drop policy if exists "Users can view message stars" on public.message_stars;
drop policy if exists "Users can star messages" on public.message_stars;
drop policy if exists "Users can unstar own messages" on public.message_stars;

create policy "Users can view message stars"
on public.message_stars
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_stars.message_id
      and cp.user_id = auth.uid()
  )
);

create policy "Users can star messages"
on public.message_stars
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_stars.message_id
      and cp.user_id = auth.uid()
  )
);

create policy "Users can unstar own messages"
on public.message_stars
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists message_reactions_message_idx
on public.message_reactions(message_id);

create index if not exists message_reactions_user_idx
on public.message_reactions(user_id);

create index if not exists message_stars_user_idx
on public.message_stars(user_id, created_at desc);

alter publication supabase_realtime add table public.message_reactions;
alter publication supabase_realtime add table public.message_stars;
