-- Add proper foreign key relationships for comments
-- This ensures Supabase can automatically join profiles

ALTER TABLE public.digital_product_comments
  ADD CONSTRAINT fk_digital_product_comments_profiles
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Ensure the table is properly set up
-- You can ignore "duplicate key value violates unique constraint" errors
