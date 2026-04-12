-- Create digital_product_comments table
CREATE TABLE digital_product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES selling_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES digital_product_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_seller BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create index for faster queries
CREATE INDEX idx_digital_product_comments_item_id ON digital_product_comments(item_id);
CREATE INDEX idx_digital_product_comments_user_id ON digital_product_comments(user_id);
CREATE INDEX idx_digital_product_comments_parent_id ON digital_product_comments(parent_comment_id);

-- Enable RLS
ALTER TABLE digital_product_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view comments on items with comments enabled
CREATE POLICY "view_comments"
  ON digital_product_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM selling_items
      WHERE id = digital_product_comments.item_id
      AND allow_comments = true
    )
    OR is_deleted = FALSE
  );

-- RLS Policy: Users can insert their own comments
CREATE POLICY "insert_own_comment"
  ON digital_product_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can update their own comments
CREATE POLICY "update_own_comment"
  ON digital_product_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can delete their own comments, sellers can delete any
CREATE POLICY "delete_comment"
  ON digital_product_comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM selling_items
      WHERE id = digital_product_comments.item_id
      AND seller_id = auth.uid()
    )
  );
