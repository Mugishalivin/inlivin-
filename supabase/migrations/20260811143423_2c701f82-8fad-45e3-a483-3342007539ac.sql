-- ============ BADGES ============
UPDATE public.creator_badges cb
SET user_id = p.user_id
FROM public.profiles p
WHERE cb.user_id = p.id AND p.id <> p.user_id;

ALTER TABLE public.creator_badges DROP CONSTRAINT IF EXISTS creator_badges_user_id_fkey;
ALTER TABLE public.creator_badges ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE public.creator_badges ALTER COLUMN awarded_at SET DEFAULT now();
UPDATE public.creator_badges SET is_active = true WHERE is_active IS NULL;
UPDATE public.creator_badges SET awarded_at = COALESCE(awarded_at, earned_at, now()) WHERE awarded_at IS NULL;

DELETE FROM public.creator_badges a
USING public.creator_badges b
WHERE a.user_id = b.user_id AND a.badge_type = b.badge_type AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS creator_badges_user_badge_uniq
  ON public.creator_badges (user_id, badge_type);

GRANT SELECT ON public.creator_badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_badges TO authenticated;
GRANT ALL ON public.creator_badges TO service_role;

ALTER TABLE public.creator_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins manage badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can insert badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can update badges" ON public.creator_badges;
DROP POLICY IF EXISTS "Admins can delete badges" ON public.creator_badges;

CREATE POLICY "Badges are viewable by everyone"
  ON public.creator_badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert badges"
  ON public.creator_badges FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update badges"
  ON public.creator_badges FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete badges"
  ON public.creator_badges FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ CALLS ============
ALTER TABLE public.call_sessions
  ADD COLUMN IF NOT EXISTS is_group boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS title text,
  ALTER COLUMN recipient_id DROP NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.call_sessions TO authenticated;
GRANT ALL ON public.call_sessions TO service_role;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view conversation calls" ON public.call_sessions;
DROP POLICY IF EXISTS "Members start conversation calls" ON public.call_sessions;
DROP POLICY IF EXISTS "Members update conversation calls" ON public.call_sessions;

CREATE POLICY "Members view conversation calls"
  ON public.call_sessions FOR SELECT TO authenticated
  USING (public.is_conversation_member(auth.uid(), conversation_id));

CREATE POLICY "Members start conversation calls"
  ON public.call_sessions FOR INSERT TO authenticated
  WITH CHECK (initiator_id = auth.uid() AND public.is_conversation_member(auth.uid(), conversation_id));

CREATE POLICY "Members update conversation calls"
  ON public.call_sessions FOR UPDATE TO authenticated
  USING (public.is_conversation_member(auth.uid(), conversation_id))
  WITH CHECK (public.is_conversation_member(auth.uid(), conversation_id));

CREATE TABLE IF NOT EXISTS public.call_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'invited',
  is_muted boolean NOT NULL DEFAULT false,
  is_video_on boolean NOT NULL DEFAULT true,
  is_screen_sharing boolean NOT NULL DEFAULT false,
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_participants TO authenticated;
GRANT ALL ON public.call_participants TO service_role;
ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_access_call(_user_id uuid, _session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.call_sessions cs
    WHERE cs.id = _session_id
      AND public.is_conversation_member(_user_id, cs.conversation_id)
  )
$$;

CREATE POLICY "Call members view participants"
  ON public.call_participants FOR SELECT TO authenticated
  USING (public.can_access_call(auth.uid(), session_id));

CREATE POLICY "Call members add participants"
  ON public.call_participants FOR INSERT TO authenticated
  WITH CHECK (public.can_access_call(auth.uid(), session_id));

CREATE POLICY "Participants update own row"
  ON public.call_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Participants remove own row"
  ON public.call_participants FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_call_participants_updated_at
  BEFORE UPDATE ON public.call_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS call_signals_session_to_idx
  ON public.call_signals (session_id, to_user_id, created_at);

GRANT SELECT, INSERT, DELETE ON public.call_signals TO authenticated;
GRANT ALL ON public.call_signals TO service_role;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients read own signals"
  ON public.call_signals FOR SELECT TO authenticated
  USING (to_user_id = auth.uid() OR from_user_id = auth.uid());

CREATE POLICY "Call members send signals"
  ON public.call_signals FOR INSERT TO authenticated
  WITH CHECK (from_user_id = auth.uid() AND public.can_access_call(auth.uid(), session_id));

CREATE POLICY "Senders delete own signals"
  ON public.call_signals FOR DELETE TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.call_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;