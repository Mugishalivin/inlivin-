-- Add group admin features to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS group_description TEXT,
ADD COLUMN IF NOT EXISTS group_image_url TEXT,
ADD COLUMN IF NOT EXISTS group_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS group_permissions jsonb DEFAULT jsonb_build_object(
  'anyone_can_add_members', false,
  'anyone_can_remove_members', false,
  'anyone_can_edit_group', false,
  'anyone_can_upload_files', true,
  'anyone_can_send_messages', true
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_group_admin ON public.conversations(group_admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_is_group_admin ON public.conversations(is_group, group_admin_id);
