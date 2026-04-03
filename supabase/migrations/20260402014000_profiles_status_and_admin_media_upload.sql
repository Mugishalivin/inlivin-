-- Add profile status for moderation and support media uploads.

alter table public.profiles
add column if not exists status text not null default 'active';

create index if not exists profiles_status_idx on public.profiles(status);

-- Ensure content/admin tables can store media uploads consistently.
alter table public.announcements
add column if not exists media_url text;

alter table public.announcements
add column if not exists media_type text;

alter table public.promotions
add column if not exists media_url text;

alter table public.promotions
add column if not exists media_type text;

alter table public.ads
add column if not exists media_url text;

alter table public.ads
add column if not exists media_type text;
