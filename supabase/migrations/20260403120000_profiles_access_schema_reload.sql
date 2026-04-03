alter table public.profiles
  add column if not exists status text not null default 'active';

alter table public.profiles enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.admin_get_profiles()
returns table (
  id uuid,
  user_id uuid,
  display_name text,
  username text,
  bio text,
  avatar_url text,
  location text,
  website text,
  last_seen_at timestamptz,
  created_at timestamptz,
  status text,
  role text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    p.user_id,
    p.display_name,
    p.username,
    p.bio,
    p.avatar_url,
    p.location,
    p.website,
    p.last_seen_at,
    p.created_at,
    coalesce(p.status, 'active') as status,
    coalesce(
      (
        select ur.role::text
        from public.user_roles ur
        where ur.user_id = p.user_id
        order by case ur.role
          when 'admin' then 0
          when 'moderator' then 1
          else 2
        end
        limit 1
      ),
      'user'
    ) as role
  from public.profiles p
  where public.has_role(auth.uid(), 'admin')
  order by p.created_at desc;
$$;

revoke all on function public.admin_get_profiles() from public;
grant execute on function public.admin_get_profiles() to authenticated;

notify pgrst, 'reload schema';
