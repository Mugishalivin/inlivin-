-- User comments on platform updates, visible to admins.

create table if not exists public.update_comments (
  id uuid primary key default gen_random_uuid(),
  commenter_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  content text not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.update_comments enable row level security;

drop policy if exists "Users can create update comments" on public.update_comments;
drop policy if exists "Users can read own update comments" on public.update_comments;
drop policy if exists "Admins can read update comments" on public.update_comments;
drop policy if exists "Admins can update update comments" on public.update_comments;

create policy "Users can create update comments"
  on public.update_comments for insert
  to authenticated
  with check (commenter_id = auth.uid());

create policy "Users can read own update comments"
  on public.update_comments for select
  to authenticated
  using (commenter_id = auth.uid());

create policy "Admins can read update comments"
  on public.update_comments for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update update comments"
  on public.update_comments for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists update_comments_created_at_idx on public.update_comments(created_at desc);
create index if not exists update_comments_entity_idx on public.update_comments(entity_type, entity_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'update_update_comments_updated_at'
  ) then
    create trigger update_update_comments_updated_at
    before update on public.update_comments
    for each row execute function public.update_updated_at_column();
  end if;
end
$$;

alter publication supabase_realtime add table public.update_comments;
