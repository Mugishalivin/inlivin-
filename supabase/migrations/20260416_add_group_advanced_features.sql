-- Add group member roles and permissions
create table if not exists public.group_member_roles (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member', -- admin, moderator, member
  permissions text[] default array['send_messages']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(conversation_id, user_id)
);

alter table public.group_member_roles enable row level security;

create policy "Users can view group member roles"
on public.group_member_roles
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = group_member_roles.conversation_id
      and cp.user_id = auth.uid()
  )
);

create policy "Admins can manage group member roles"
on public.group_member_roles
for all
to authenticated
using (
  exists (
    select 1
    from public.group_member_roles gmr
    where gmr.conversation_id = group_member_roles.conversation_id
      and gmr.user_id = auth.uid()
      and gmr.role = 'admin'
  )
);

-- Create group join links
create table if not exists public.group_join_links (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz,
  max_uses int,
  used_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.group_join_links enable row level security;

create policy "Users can view active join links"
on public.group_join_links
for select
to authenticated
using (
  is_active 
  and (expires_at is null or expires_at > now())
  and (max_uses is null or used_count < max_uses)
  and exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = group_join_links.conversation_id
      and cp.user_id = auth.uid()
  )
);

-- Create message search/indexing
create table if not exists public.message_search_index (
  message_id uuid not null references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  content_text text,
  keywords text[],
  created_at timestamptz not null default now(),
  primary key (message_id)
);

alter table public.message_search_index enable row level security;

create policy "Users can search messages in their conversations"
on public.message_search_index
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = message_search_index.conversation_id
      and cp.user_id = auth.uid()
  )
);

-- Create indexes
create index if not exists group_member_roles_conversation_idx on public.group_member_roles(conversation_id);
create index if not exists group_member_roles_user_idx on public.group_member_roles(user_id);
create index if not exists group_member_roles_role_idx on public.group_member_roles(role);
create index if not exists group_join_links_code_idx on public.group_join_links(code);
create index if not exists group_join_links_conversation_idx on public.group_join_links(conversation_id);
create index if not exists message_search_index_conversation_idx on public.message_search_index(conversation_id);
create index if not exists message_search_index_keywords_idx on public.message_search_index using gin(keywords);
