-- Add new fields to events table for enhanced event creation features
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS short_description text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'art',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_virtual boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_links jsonb,
ADD COLUMN IF NOT EXISTS guidelines text,
ADD COLUMN IF NOT EXISTS dress_code text,
ADD COLUMN IF NOT EXISTS age_restriction text,
ADD COLUMN IF NOT EXISTS announcement_text text;
