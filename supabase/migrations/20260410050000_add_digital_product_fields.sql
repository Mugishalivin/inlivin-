-- Add digital product fields to selling_items table
ALTER TABLE public.selling_items 
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_size text,
ADD COLUMN IF NOT EXISTS file_format text,
ADD COLUMN IF NOT EXISTS license_type text,
ADD COLUMN IF NOT EXISTS tags text,
ADD COLUMN IF NOT EXISTS seller_notes text,
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'Public',
ADD COLUMN IF NOT EXISTS accepted_payment_methods text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- Drop old physical product columns that aren't needed for digital products
-- We'll keep them for backward compatibility but won't use them in the form
-- If you want to completely remove them, uncomment the lines below:
-- ALTER TABLE public.selling_items 
-- DROP COLUMN IF EXISTS stock_count,
-- DROP COLUMN IF EXISTS condition;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS selling_items_visibility_idx ON public.selling_items(visibility);
CREATE INDEX IF NOT EXISTS selling_items_seller_notes_idx ON public.selling_items(seller_notes);

-- Add comment to document the purpose
COMMENT ON TABLE public.selling_items IS 'Marketplace table for selling digital and physical products (audio, video, images, projects, etc.)';
