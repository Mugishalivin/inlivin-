-- Create digital_product_comments table
CREATE TABLE IF NOT EXISTS public.digital_product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.selling_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.digital_product_comments(id) ON DELETE CASCADE,
  is_seller BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_digital_product_comments_item_id ON public.digital_product_comments(item_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_comments_user_id ON public.digital_product_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_product_comments_parent_comment_id ON public.digital_product_comments(parent_comment_id);

-- Enable RLS
ALTER TABLE public.digital_product_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Comments are visible to all" ON public.digital_product_comments
  FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Users can insert comments" ON public.digital_product_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.digital_product_comments
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to bypass RLS for admin operations
CREATE POLICY "Allow all for service role" ON public.digital_product_comments
  FOR ALL USING (auth.role() = 'service_role');
