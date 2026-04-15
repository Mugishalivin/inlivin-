-- Fix comment delete RLS policy - more permissive version
-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Comments are visible to all" ON public.digital_product_comments;
DROP POLICY IF EXISTS "Users can insert comments" ON public.digital_product_comments;
DROP POLICY IF EXISTS "Users can soft-delete their comments" ON public.digital_product_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.digital_product_comments;
DROP POLICY IF EXISTS "Allow all for service role" ON public.digital_product_comments;

-- SELECT: Anyone can see non-deleted comments
CREATE POLICY "Anyone can view comments" ON public.digital_product_comments
  FOR SELECT USING (is_deleted = false);

-- INSERT: Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON public.digital_product_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own comments (soft delete by setting is_deleted=true)
CREATE POLICY "Users can update own comments" ON public.digital_product_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: We don't use hard deletes, only soft deletes via UPDATE
-- So this policy just prevents accidental hard deletes
CREATE POLICY "Prevent hard deletes" ON public.digital_product_comments
  FOR DELETE USING (FALSE);

-- Service role (admin/system) can do anything
CREATE POLICY "Service role bypass" ON public.digital_product_comments
  FOR ALL USING (auth.role() = 'service_role');
