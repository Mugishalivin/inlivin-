-- Create post_links table to store links associated with posts
CREATE TABLE IF NOT EXISTS public.post_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  icon text DEFAULT 'Globe',
  "order" integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_links
DROP POLICY IF EXISTS "Users can view links for public posts" ON public.post_links;
DROP POLICY IF EXISTS "Creators can manage their post links" ON public.post_links;

CREATE POLICY "Users can view links for public posts"
  ON public.post_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_links.post_id 
      AND (posts.is_public = true OR posts.creator_id = auth.uid())
    )
  );

CREATE POLICY "Creators can manage their post links"
  ON public.post_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_links.post_id 
      AND posts.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_links.post_id 
      AND posts.creator_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS post_links_post_id_idx ON public.post_links(post_id);
CREATE INDEX IF NOT EXISTS post_links_order_idx ON public.post_links("order");

-- Add bookmarks table if it doesn't exist (for the favorites feature in explore page)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bookmarked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bookmark_type text NOT NULL DEFAULT 'user' CHECK (bookmark_type IN ('user', 'post', 'project')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, bookmarked_id, bookmark_type)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookmarks
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON public.bookmarks;

CREATE POLICY "Users can manage their own bookmarks"
  ON public.bookmarks FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS bookmarks_bookmarked_id_idx ON public.bookmarks(bookmarked_id);
CREATE INDEX IF NOT EXISTS bookmarks_type_idx ON public.bookmarks(bookmark_type);
