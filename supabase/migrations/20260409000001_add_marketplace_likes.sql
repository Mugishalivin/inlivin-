-- Add likes_count column to selling_items if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'likes_count') THEN
    ALTER TABLE public.selling_items ADD COLUMN likes_count integer DEFAULT 0;
  END IF;
END $$;

-- Create item_likes table for tracking user likes on marketplace items
CREATE TABLE IF NOT EXISTS public.item_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.selling_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, user_id)
);

ALTER TABLE public.item_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for item_likes
DROP POLICY IF EXISTS "Users can view likes" ON public.item_likes;
DROP POLICY IF EXISTS "Users can manage their likes" ON public.item_likes;

CREATE POLICY "Users can view likes"
  ON public.item_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their likes"
  ON public.item_likes FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS item_likes_item_id_idx ON public.item_likes(item_id);
CREATE INDEX IF NOT EXISTS item_likes_user_id_idx ON public.item_likes(user_id);
