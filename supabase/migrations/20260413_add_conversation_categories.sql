-- Add category column to conversations table if it doesn't exist
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';

-- Update any existing NULL values (shouldn't be any with the default, but just in case)
UPDATE public.conversations SET category = 'general' WHERE category IS NULL;

-- Drop old constraint if it exists
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_category_check;

-- Add the constraint
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_category_check 
CHECK (category IN ('sales', 'general', 'main'));

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_conversations_category ON public.conversations(category);


