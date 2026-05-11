
-- Posts system (Instagram-style, advanced)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  caption TEXT,
  location TEXT,
  post_type TEXT NOT NULL DEFAULT 'post', -- post | reel | story | carousel
  music_track TEXT,
  music_artist TEXT,
  visibility TEXT NOT NULL DEFAULT 'public', -- public | followers | private
  allow_comments BOOLEAN NOT NULL DEFAULT true,
  hide_like_count BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  is_collab BOOLEAN NOT NULL DEFAULT false,
  collab_user_ids UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  mentioned_user_ids UUID[] DEFAULT '{}',
  view_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ, -- for stories (24h)
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_user ON public.posts(user_id);
CREATE INDEX idx_posts_type_created ON public.posts(post_type, created_at DESC);
CREATE INDEX idx_posts_expires ON public.posts(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL, -- image | video | audio
  thumbnail_url TEXT,
  alt_text TEXT,
  display_order INT NOT NULL DEFAULT 0,
  duration_seconds NUMERIC,
  width INT,
  height INT,
  filters JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_media_post ON public.post_media(post_id, display_order);

CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction TEXT NOT NULL DEFAULT 'like', -- like | love | laugh | wow | sad | fire
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
CREATE INDEX idx_post_likes_post ON public.post_likes(post_id);

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_comments_post ON public.post_comments(post_id, created_at);

CREATE TABLE public.post_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  collection TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, collection)
);

CREATE TABLE public.post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id UUID,
  watched_seconds NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_views_post ON public.post_views(post_id);

CREATE TABLE public.post_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  closes_at TIMESTAMPTZ,
  multi_select BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.post_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.post_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id, option_index)
);

CREATE TABLE public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

CREATE TABLE public.post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_hashtags_tag ON public.post_hashtags(tag);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "posts_select_public" ON public.posts FOR SELECT USING (
  is_draft = false AND (visibility = 'public' OR user_id = auth.uid())
);
CREATE POLICY "posts_select_own" ON public.posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- post_media policies
CREATE POLICY "post_media_select" ON public.post_media FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.posts p WHERE p.id = post_id AND (p.visibility = 'public' OR p.user_id = auth.uid()))
);
CREATE POLICY "post_media_manage_own" ON public.post_media FOR ALL USING (
  EXISTS(SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
);

-- likes
CREATE POLICY "post_likes_select" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete_own" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- comments
CREATE POLICY "post_comments_select" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "post_comments_insert" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_comments_update_own" ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "post_comments_delete_own" ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- saves
CREATE POLICY "post_saves_own" ON public.post_saves FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- views
CREATE POLICY "post_views_insert" ON public.post_views FOR INSERT WITH CHECK (true);
CREATE POLICY "post_views_select" ON public.post_views FOR SELECT USING (true);

-- polls
CREATE POLICY "post_polls_select" ON public.post_polls FOR SELECT USING (true);
CREATE POLICY "post_polls_manage_own" ON public.post_polls FOR ALL USING (
  EXISTS(SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
);

CREATE POLICY "poll_votes_select" ON public.post_poll_votes FOR SELECT USING (true);
CREATE POLICY "poll_votes_insert" ON public.post_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "poll_votes_delete_own" ON public.post_poll_votes FOR DELETE USING (auth.uid() = user_id);

-- story views
CREATE POLICY "story_views_select" ON public.story_views FOR SELECT USING (
  auth.uid() = viewer_id OR EXISTS(SELECT 1 FROM public.posts p WHERE p.id = story_id AND p.user_id = auth.uid())
);
CREATE POLICY "story_views_insert" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- hashtags
CREATE POLICY "post_hashtags_select" ON public.post_hashtags FOR SELECT USING (true);
CREATE POLICY "post_hashtags_insert" ON public.post_hashtags FOR INSERT WITH CHECK (
  EXISTS(SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
);

CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_post_comments_updated BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
