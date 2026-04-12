-- Add missing columns to selling_items table for comprehensive digital product marketplace
DO $$ BEGIN
  -- Digital Product Fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'file_url') THEN
    ALTER TABLE public.selling_items ADD COLUMN file_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'file_format') THEN
    ALTER TABLE public.selling_items ADD COLUMN file_format text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'license_type') THEN
    ALTER TABLE public.selling_items ADD COLUMN license_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'tags') THEN
    ALTER TABLE public.selling_items ADD COLUMN tags text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'seller_notes') THEN
    ALTER TABLE public.selling_items ADD COLUMN seller_notes text;
  END IF;
  
  -- Metadata Fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'language') THEN
    ALTER TABLE public.selling_items ADD COLUMN language text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'quality') THEN
    ALTER TABLE public.selling_items ADD COLUMN quality text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'duration') THEN
    ALTER TABLE public.selling_items ADD COLUMN duration text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'resolution') THEN
    ALTER TABLE public.selling_items ADD COLUMN resolution text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'software_used') THEN
    ALTER TABLE public.selling_items ADD COLUMN software_used text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'skill_level') THEN
    ALTER TABLE public.selling_items ADD COLUMN skill_level text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'keywords') THEN
    ALTER TABLE public.selling_items ADD COLUMN keywords text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'usage_rights') THEN
    ALTER TABLE public.selling_items ADD COLUMN usage_rights text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'version') THEN
    ALTER TABLE public.selling_items ADD COLUMN version text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'artist_name') THEN
    ALTER TABLE public.selling_items ADD COLUMN artist_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'contact_email') THEN
    ALTER TABLE public.selling_items ADD COLUMN contact_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'collaborators') THEN
    ALTER TABLE public.selling_items ADD COLUMN collaborators text;
  END IF;
  
  -- Boolean Flags
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'commercial_use') THEN
    ALTER TABLE public.selling_items ADD COLUMN commercial_use boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'resale_allowed') THEN
    ALTER TABLE public.selling_items ADD COLUMN resale_allowed boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'sample_available') THEN
    ALTER TABLE public.selling_items ADD COLUMN sample_available boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'warranty') THEN
    ALTER TABLE public.selling_items ADD COLUMN warranty boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'support_included') THEN
    ALTER TABLE public.selling_items ADD COLUMN support_included boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'bulk_pricing') THEN
    ALTER TABLE public.selling_items ADD COLUMN bulk_pricing boolean DEFAULT false;
  END IF;
  
  -- Pricing & Policy
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'discount_percentage') THEN
    ALTER TABLE public.selling_items ADD COLUMN discount_percentage numeric(5, 2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'refund_policy') THEN
    ALTER TABLE public.selling_items ADD COLUMN refund_policy text;
  END IF;
  
  -- Distribution
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'visibility') THEN
    ALTER TABLE public.selling_items ADD COLUMN visibility text DEFAULT 'Public';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'selling_items' AND column_name = 'accepted_payment_methods') THEN
    ALTER TABLE public.selling_items ADD COLUMN accepted_payment_methods text[] DEFAULT ARRAY['Credit Card', 'PayPal'];
  END IF;
END $$;

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_selling_items_language ON public.selling_items(language);
CREATE INDEX IF NOT EXISTS idx_selling_items_visibility ON public.selling_items(visibility);
CREATE INDEX IF NOT EXISTS idx_selling_items_keywords ON public.selling_items(keywords);
