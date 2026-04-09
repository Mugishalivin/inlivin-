-- Create engagement tracking tables for digital products marketplace

-- Digital Product Views
CREATE TABLE IF NOT EXISTS public.digital_product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.selling_items(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS digital_product_views_item_id_idx ON public.digital_product_views(item_id);
CREATE INDEX IF NOT EXISTS digital_product_views_viewer_id_idx ON public.digital_product_views(viewer_id);
CREATE INDEX IF NOT EXISTS digital_product_views_viewed_at_idx ON public.digital_product_views(viewed_at DESC);

-- Digital Product Likes
CREATE TABLE IF NOT EXISTS public.digital_product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.selling_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, user_id)
);

CREATE INDEX IF NOT EXISTS digital_product_likes_item_id_idx ON public.digital_product_likes(item_id);
CREATE INDEX IF NOT EXISTS digital_product_likes_user_id_idx ON public.digital_product_likes(user_id);

-- Digital Product Interactions (Comments)
CREATE TABLE IF NOT EXISTS public.digital_product_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.selling_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_type text, -- 'question', 'review', 'feedback'
  comment_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS digital_product_interactions_item_id_idx ON public.digital_product_interactions(item_id);
CREATE INDEX IF NOT EXISTS digital_product_interactions_user_id_idx ON public.digital_product_interactions(user_id);

-- Digital Product Shares
CREATE TABLE IF NOT EXISTS public.digital_product_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.selling_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, user_id)
);

CREATE INDEX IF NOT EXISTS digital_product_shares_item_id_idx ON public.digital_product_shares(item_id);
CREATE INDEX IF NOT EXISTS digital_product_shares_user_id_idx ON public.digital_product_shares(user_id);

-- Digital Product Bookmarks (Favorites/Wishlist)
CREATE TABLE IF NOT EXISTS public.digital_product_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.selling_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bookmarked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, user_id)
);

CREATE INDEX IF NOT EXISTS digital_product_bookmarks_item_id_idx ON public.digital_product_bookmarks(item_id);
CREATE INDEX IF NOT EXISTS digital_product_bookmarks_user_id_idx ON public.digital_product_bookmarks(user_id);

-- Enable Row Level Security
ALTER TABLE public.digital_product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Views
CREATE POLICY "Anyone can view product views"
  ON public.digital_product_views FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can record their views"
  ON public.digital_product_views FOR INSERT
  TO authenticated
  WITH CHECK (viewer_id = auth.uid());

-- RLS Policies for Likes
CREATE POLICY "Anyone can see product likes"
  ON public.digital_product_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can like/unlike products"
  ON public.digital_product_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their likes"
  ON public.digital_product_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for Interactions
CREATE POLICY "Anyone can see interactions"
  ON public.digital_product_interactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create interactions"
  ON public.digital_product_interactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Shares
CREATE POLICY "Anyone can see shares"
  ON public.digital_product_shares FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can record shares"
  ON public.digital_product_shares FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Bookmarks
CREATE POLICY "Users can see their bookmarks"
  ON public.digital_product_bookmarks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR true);

CREATE POLICY "Users can manage their bookmarks"
  ON public.digital_product_bookmarks FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add engagement count columns to selling_items if they don't exist
ALTER TABLE public.selling_items
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS interactions_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS bookmarks_count integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS selling_items_views_count_idx ON public.selling_items(views_count DESC);
CREATE INDEX IF NOT EXISTS selling_items_shares_count_idx ON public.selling_items(shares_count DESC);
