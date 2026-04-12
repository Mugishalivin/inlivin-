-- Add professional marketplace features to selling_items table
DO $$ BEGIN
  -- Password Protection
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'download_password') THEN
    ALTER TABLE public.selling_items ADD COLUMN download_password text;
  END IF;

  -- Comment Controls
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'allow_comments') THEN
    ALTER TABLE public.selling_items ADD COLUMN allow_comments boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'comments_visible_to_all') THEN
    ALTER TABLE public.selling_items ADD COLUMN comments_visible_to_all boolean DEFAULT false;
  END IF;

  -- Views Tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'views_count') THEN
    ALTER TABLE public.selling_items ADD COLUMN views_count integer DEFAULT 0;
  END IF;

END $$;

-- Create index for views tracking
CREATE INDEX IF NOT EXISTS idx_selling_items_views_count ON public.selling_items(views_count);
