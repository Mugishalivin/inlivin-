-- Event Bookmarks Table
CREATE TABLE IF NOT EXISTS public.event_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_bookmarks_user_id ON public.event_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_event_bookmarks_event_id ON public.event_bookmarks(event_id);

-- RLS Policies
ALTER TABLE public.event_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event bookmarks"
  ON public.event_bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create event bookmarks"
  ON public.event_bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event bookmarks"
  ON public.event_bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);
