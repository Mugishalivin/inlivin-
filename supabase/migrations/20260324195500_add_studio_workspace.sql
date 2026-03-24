-- Studio workspace tables for asset vault, tasks, and scheduling

CREATE TABLE IF NOT EXISTS public.studio_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  mime_type text,
  file_size bigint,
  category text,
  tags text[] NOT NULL DEFAULT '{}'::text[],
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Studio assets are viewable by owner" ON public.studio_assets;
DROP POLICY IF EXISTS "Studio assets insert by owner" ON public.studio_assets;
DROP POLICY IF EXISTS "Studio assets update by owner" ON public.studio_assets;
DROP POLICY IF EXISTS "Studio assets delete by owner" ON public.studio_assets;

CREATE POLICY "Studio assets are viewable by owner"
  ON public.studio_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Studio assets insert by owner"
  ON public.studio_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Studio assets update by owner"
  ON public.studio_assets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Studio assets delete by owner"
  ON public.studio_assets FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS studio_assets_user_id_idx ON public.studio_assets(user_id);
CREATE INDEX IF NOT EXISTS studio_assets_created_at_idx ON public.studio_assets(created_at DESC);

DROP TRIGGER IF EXISTS update_studio_assets_updated_at ON public.studio_assets;
CREATE TRIGGER update_studio_assets_updated_at
  BEFORE UPDATE ON public.studio_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.studio_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'todo',
  due_date timestamptz,
  reminder_at timestamptz,
  category text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Studio tasks are viewable by owner" ON public.studio_tasks;
DROP POLICY IF EXISTS "Studio tasks insert by owner" ON public.studio_tasks;
DROP POLICY IF EXISTS "Studio tasks update by owner" ON public.studio_tasks;
DROP POLICY IF EXISTS "Studio tasks delete by owner" ON public.studio_tasks;

CREATE POLICY "Studio tasks are viewable by owner"
  ON public.studio_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Studio tasks insert by owner"
  ON public.studio_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Studio tasks update by owner"
  ON public.studio_tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Studio tasks delete by owner"
  ON public.studio_tasks FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS studio_tasks_user_id_idx ON public.studio_tasks(user_id);
CREATE INDEX IF NOT EXISTS studio_tasks_due_date_idx ON public.studio_tasks(due_date);

DROP TRIGGER IF EXISTS update_studio_tasks_updated_at ON public.studio_tasks;
CREATE TRIGGER update_studio_tasks_updated_at
  BEFORE UPDATE ON public.studio_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.studio_schedule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  scheduled_at timestamptz NOT NULL,
  item_type text NOT NULL DEFAULT 'session',
  status text NOT NULL DEFAULT 'planned',
  color text NOT NULL DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_schedule_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Studio schedule items are viewable by owner" ON public.studio_schedule_items;
DROP POLICY IF EXISTS "Studio schedule items insert by owner" ON public.studio_schedule_items;
DROP POLICY IF EXISTS "Studio schedule items update by owner" ON public.studio_schedule_items;
DROP POLICY IF EXISTS "Studio schedule items delete by owner" ON public.studio_schedule_items;

CREATE POLICY "Studio schedule items are viewable by owner"
  ON public.studio_schedule_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Studio schedule items insert by owner"
  ON public.studio_schedule_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Studio schedule items update by owner"
  ON public.studio_schedule_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Studio schedule items delete by owner"
  ON public.studio_schedule_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS studio_schedule_items_user_id_idx ON public.studio_schedule_items(user_id);
CREATE INDEX IF NOT EXISTS studio_schedule_items_scheduled_at_idx ON public.studio_schedule_items(scheduled_at);

DROP TRIGGER IF EXISTS update_studio_schedule_items_updated_at ON public.studio_schedule_items;
CREATE TRIGGER update_studio_schedule_items_updated_at
  BEFORE UPDATE ON public.studio_schedule_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
