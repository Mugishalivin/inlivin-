-- Create selling_items table for marketplace/shop feature
CREATE TABLE IF NOT EXISTS public.selling_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  name text,
  description text,
  category text,
  price numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  image_url text,
  images_urls text[],
  is_available boolean NOT NULL DEFAULT true,
  stock_count integer DEFAULT 1,
  views_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.selling_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for selling_items
DROP POLICY IF EXISTS "Users can view available items" ON public.selling_items;
DROP POLICY IF EXISTS "Sellers can manage their items" ON public.selling_items;

CREATE POLICY "Users can view available items"
  ON public.selling_items FOR SELECT
  TO authenticated
  USING (is_available = true OR seller_id = auth.uid());

CREATE POLICY "Sellers can manage their items"
  ON public.selling_items FOR ALL
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS selling_items_seller_id_idx ON public.selling_items(seller_id);
CREATE INDEX IF NOT EXISTS selling_items_is_available_idx ON public.selling_items(is_available);
CREATE INDEX IF NOT EXISTS selling_items_created_at_idx ON public.selling_items(created_at DESC);
CREATE INDEX IF NOT EXISTS selling_items_category_idx ON public.selling_items(category);

-- Create posts table for user content/social feed
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  image_url text,
  images_urls text[],
  is_public boolean NOT NULL DEFAULT true,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for posts
DROP POLICY IF EXISTS "Users can view public posts" ON public.posts;
DROP POLICY IF EXISTS "Users can manage their posts" ON public.posts;

CREATE POLICY "Users can view public posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can manage their posts"
  ON public.posts FOR ALL
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS posts_creator_id_idx ON public.posts(creator_id);
CREATE INDEX IF NOT EXISTS posts_is_public_idx ON public.posts(is_public);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);

-- Update events table if needed (ensure these columns exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'cover_url') THEN
    ALTER TABLE public.events ADD COLUMN cover_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'event_type') THEN
    ALTER TABLE public.events ADD COLUMN event_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'location') THEN
    ALTER TABLE public.events ADD COLUMN location text;
  END IF;
END $$;
