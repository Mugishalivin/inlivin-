-- ============================================
-- COMPREHENSIVE EVENT FEATURES MIGRATION
-- ============================================

-- 1. Add columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_cancelled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS show_attendees boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS price numeric(10,2),
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- 2. Event Ratings Table
CREATE TABLE IF NOT EXISTS public.event_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_ratings_event_id ON public.event_ratings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_ratings_user_id ON public.event_ratings(user_id);

-- 3. Event Waiting List Table
CREATE TABLE IF NOT EXISTS public.event_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_waitlist_event_id ON public.event_waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_event_waitlist_user_id ON public.event_waitlist(user_id);

-- 4. Event Co-hosts Table
CREATE TABLE IF NOT EXISTS public.event_cohosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_cohosts_event_id ON public.event_cohosts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_cohosts_user_id ON public.event_cohosts(user_id);

-- 5. Event Snapshots (Post-event highlights)
CREATE TABLE IF NOT EXISTS public.event_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  title text,
  description text,
  display_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_snapshots_event_id ON public.event_snapshots(event_id);
CREATE INDEX IF NOT EXISTS idx_event_snapshots_user_id ON public.event_snapshots(user_id);

-- 6. Event Series (Recurring events)
CREATE TABLE IF NOT EXISTS public.event_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text,
  recurrence_pattern text NOT NULL CHECK (recurrence_pattern IN ('weekly', 'biweekly', 'monthly')),
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_series_creator_id ON public.event_series(creator_id);

-- Link events to series
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS series_id uuid REFERENCES public.event_series(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_series_id ON public.events(series_id);

-- 7. Event Check-ins (QR code based)
CREATE TABLE IF NOT EXISTS public.event_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_time timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_checkins_event_id ON public.event_checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_event_checkins_user_id ON public.event_checkins(user_id);

-- 8. Event Reminders
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('1day', '1hour')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON public.event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_user_id ON public.event_reminders(user_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Event Ratings RLS
ALTER TABLE public.event_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings for public events"
  ON public.event_ratings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_ratings.event_id AND events.is_public = true));

CREATE POLICY "Users can rate public events"
  ON public.event_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.events WHERE events.id = event_ratings.event_id AND events.is_public = true));

CREATE POLICY "Users can update own ratings"
  ON public.event_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.event_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Event Waitlist RLS
ALTER TABLE public.event_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own waitlist entries"
  ON public.event_waitlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join event waitlist"
  ON public.event_waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves from waitlist"
  ON public.event_waitlist FOR DELETE
  USING (auth.uid() = user_id);

-- Event Co-hosts RLS
ALTER TABLE public.event_cohosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event creator can manage cohosts"
  ON public.event_cohosts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_cohosts.event_id AND events.user_id = auth.uid()));

CREATE POLICY "Cohosts can view their own entries"
  ON public.event_cohosts FOR SELECT
  USING (auth.uid() = user_id);

-- Event Snapshots RLS
ALTER TABLE public.event_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view snapshots for public events"
  ON public.event_snapshots FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_snapshots.event_id AND events.is_public = true));

CREATE POLICY "Event creator can add snapshots"
  ON public.event_snapshots FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_snapshots.event_id AND events.user_id = auth.uid()));

CREATE POLICY "Snapshot creator can update own snapshots"
  ON public.event_snapshots FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Event Series RLS
ALTER TABLE public.event_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator can manage own series"
  ON public.event_series FOR ALL
  USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can view series"
  ON public.event_series FOR SELECT
  USING (true);

-- Check-ins RLS
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event creator can view checkins"
  ON public.event_checkins FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_checkins.event_id AND events.user_id = auth.uid()));

CREATE POLICY "Users can checkin to events they're attending"
  ON public.event_checkins FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.event_rsvps WHERE event_rsvps.event_id = event_checkins.event_id AND event_rsvps.user_id = auth.uid())
  );

-- Reminders RLS
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON public.event_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reminders for events they're attending"
  ON public.event_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.event_rsvps WHERE event_rsvps.event_id = event_reminders.event_id AND event_rsvps.user_id = auth.uid()));
