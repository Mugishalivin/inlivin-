-- Create selling_items table for digital products marketplace
CREATE TABLE IF NOT EXISTS public.selling_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  title text NOT NULL,
  description text,
  category text,
  
  -- Pricing
  price numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  
  -- Image/Thumbnail
  image_url text,
  images_urls text[],
  
  -- Digital Product Fields
  file_url text,
  file_format text,
  license_type text,
  tags text,
  seller_notes text,
  
  -- Distribution
  visibility text DEFAULT 'Public',
  accepted_payment_methods text[] DEFAULT '{}',
  
  -- Meta
  is_available boolean NOT NULL DEFAULT true,
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.selling_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view available items" ON public.selling_items;
DROP POLICY IF EXISTS "Sellers can manage their items" ON public.selling_items;

-- RLS Policies
CREATE POLICY "Users can view available items"
  ON public.selling_items FOR SELECT
  TO authenticated
  USING (is_available = true OR seller_id = auth.uid());

CREATE POLICY "Sellers can manage their items"
  ON public.selling_items FOR ALL
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS selling_items_seller_id_idx ON public.selling_items(seller_id);
CREATE INDEX IF NOT EXISTS selling_items_is_available_idx ON public.selling_items(is_available);
CREATE INDEX IF NOT EXISTS selling_items_created_at_idx ON public.selling_items(created_at DESC);
CREATE INDEX IF NOT EXISTS selling_items_category_idx ON public.selling_items(category);
CREATE INDEX IF NOT EXISTS selling_items_visibility_idx ON public.selling_items(visibility);
CREATE INDEX IF NOT EXISTS selling_items_likes_count_idx ON public.selling_items(likes_count DESC);

-- Update timestamp on modification
CREATE OR REPLACE FUNCTION public.update_selling_items_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_selling_items_timestamp ON public.selling_items;

CREATE TRIGGER update_selling_items_timestamp
  BEFORE UPDATE ON public.selling_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_selling_items_timestamp();

COMMENT ON TABLE public.selling_items IS 'Digital marketplace for selling audio, video, images, and projects';
