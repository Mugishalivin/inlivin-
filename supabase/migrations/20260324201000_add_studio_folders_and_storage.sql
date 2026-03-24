-- Studio folders and storage policies
-- Run in Supabase SQL editor or apply via supabase db push.

create table if not exists public.studio_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  color text not null default 'primary',
  icon text not null default 'folder',
  parent_id uuid references public.studio_folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.studio_folders enable row level security;

drop policy if exists "Studio folders are viewable by owner" on public.studio_folders;
drop policy if exists "Studio folders insert by owner" on public.studio_folders;
drop policy if exists "Studio folders update by owner" on public.studio_folders;
drop policy if exists "Studio folders delete by owner" on public.studio_folders;

create policy "Studio folders are viewable by owner"
  on public.studio_folders for select
  using (auth.uid() = user_id);

create policy "Studio folders insert by owner"
  on public.studio_folders for insert
  with check (auth.uid() = user_id);

create policy "Studio folders update by owner"
  on public.studio_folders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Studio folders delete by owner"
  on public.studio_folders for delete
  using (auth.uid() = user_id);

create index if not exists studio_folders_user_id_idx on public.studio_folders(user_id);
create index if not exists studio_folders_parent_id_idx on public.studio_folders(parent_id);

drop trigger if exists update_studio_folders_updated_at on public.studio_folders;
create trigger update_studio_folders_updated_at
  before update on public.studio_folders
  for each row
  execute function public.update_updated_at_column();

-- Storage policies for the existing project-files bucket.
-- These keep Studio uploads accessible and isolated by folder.

drop policy if exists "Studio files view by everyone" on storage.objects;
drop policy if exists "Studio files upload by authenticated users" on storage.objects;
drop policy if exists "Studio files delete own uploads" on storage.objects;

create policy "Studio files view by everyone"
  on storage.objects for select
  using (bucket_id = 'project-files');

create policy "Studio files upload by authenticated users"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-files'
    and (
      (storage.foldername(name))[1] = 'studio-assets'
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "Studio files delete own uploads"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-files'
    and (
      (storage.foldername(name))[1] = 'studio-assets'
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
