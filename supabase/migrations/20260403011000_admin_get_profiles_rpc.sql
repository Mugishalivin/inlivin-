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
  created_at timestamptz
)
language sql
security definer
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
    p.created_at
  from public.profiles p
  order by p.created_at desc;
$$;

grant execute on function public.admin_get_profiles() to authenticated;
