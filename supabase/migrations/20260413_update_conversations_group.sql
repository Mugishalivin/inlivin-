-- Update conversations table to support group chats
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS group_name TEXT;

-- Ensure category has proper constraint
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_category_check;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_category_check 
CHECK (category IN ('sales', 'general', 'main'));

-- Update index
CREATE INDEX IF NOT EXISTS idx_conversations_category ON public.conversations(category);
CREATE INDEX IF NOT EXISTS idx_conversations_is_group ON public.conversations(is_group);
