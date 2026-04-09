-- Add event requirements field
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS requirements_info text;

-- COMMENT ON COLUMN to describe the field
COMMENT ON COLUMN public.events.requirements_info IS 'Requirements, credentials, or information needed from attendees to register for the event';
