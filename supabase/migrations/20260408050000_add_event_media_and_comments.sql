-- Event Media Table for videos, images from event creators
CREATE TABLE IF NOT EXISTS public.event_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url text NOT NULL,
  title text,
  description text,
  display_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Event Comments Table
CREATE TABLE IF NOT EXISTS public.event_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_media_event_id ON public.event_media(event_id);
CREATE INDEX IF NOT EXISTS idx_event_media_user_id ON public.event_media(user_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON public.event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_user_id ON public.event_comments(user_id);

-- RLS Policies
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- Event Media Policies
CREATE POLICY "Anyone can view public event media"
  ON public.event_media
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_media.event_id
      AND events.is_public = true
    )
  );

CREATE POLICY "Event creator can insert media"
  ON public.event_media
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_media.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Media creator can update own media"
  ON public.event_media
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Media creator can delete own media"
  ON public.event_media
  FOR DELETE
  USING (auth.uid() = user_id);

-- Event Comments Policies
CREATE POLICY "Anyone can view comments on public events"
  ON public.event_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_comments.event_id
      AND events.is_public = true
    )
  );

CREATE POLICY "Users can insert comments on public events"
  ON public.event_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_comments.event_id
      AND events.is_public = true
    )
  );

CREATE POLICY "Comment creator can update own comments"
  ON public.event_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comment creator can delete own comments"
  ON public.event_comments
  FOR DELETE
  USING (auth.uid() = user_id);
