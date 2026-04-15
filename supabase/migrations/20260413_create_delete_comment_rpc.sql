-- Create an RPC function for safe comment deletion
-- This function has SECURITY DEFINER so it runs with owner privileges and bypasses RLS
CREATE OR REPLACE FUNCTION delete_own_comment(comment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  comment_user_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- If no user logged in, fail
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get comment owner
  SELECT user_id INTO comment_user_id
  FROM public.digital_product_comments
  WHERE id = comment_id;
  
  -- If comment doesn't exist, fail
  IF comment_user_id IS NULL THEN
    RAISE EXCEPTION 'Comment not found';
  END IF;
  
  -- If user doesn't own comment, fail
  IF comment_user_id != current_user_id THEN
    RAISE EXCEPTION 'You can only delete your own comments';
  END IF;
  
  -- Soft delete the comment
  UPDATE public.digital_product_comments
  SET is_deleted = true, updated_at = NOW()
  WHERE id = comment_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_own_comment(UUID) TO authenticated;
