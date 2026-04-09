-- Creator Badges, Marketplace, Analytics, Network, Livestream, Web3, Fund

-- BADGES & ACHIEVEMENT SYSTEM
CREATE TABLE public.creator_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('verified', 'top_collaborator', 'trending_creator', 'consistent_contributor', 'community_helper', 'master_craftsman', 'rising_star')),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- MARKETPLACE LISTINGS (Sell assets, beats, samples)
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'asset',
  price DECIMAL(10, 2) NOT NULL,
  file_url TEXT,
  preview_url TEXT,
  license_type TEXT NOT NULL DEFAULT 'personal' CHECK (license_type IN ('personal', 'commercial', 'exclusive')),
  is_active BOOLEAN DEFAULT true,
  sales_count INTEGER DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- COMMISSIONS (Hire creators)
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  budget DECIMAL(10, 2),
  deadline DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CREATOR ANALYTICS
CREATE TABLE public.creator_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  profile_views INTEGER DEFAULT 0,
  project_views INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  comments_received INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  total_followers INTEGER DEFAULT 0,
  collaboration_requests INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10, 2) DEFAULT 0,
  trending_rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, date)
);

-- CREATOR NETWORK (Smart recommendations)
CREATE TABLE public.creator_network (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_type TEXT DEFAULT 'follow' CHECK (connection_type IN ('follow', 'collaborator', 'recommended', 'network')),
  compatibility_score DECIMAL(3, 2),
  shared_interests TEXT[], -- tags they have in common
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(creator_id, connected_id)
);

-- CREATOR RECOMMENDATIONS  
CREATE TABLE public.creator_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommended_creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  score DECIMAL(3, 2),
  seen BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, recommended_creator_id)
);

-- TRENDING COLLECTIONS
CREATE TABLE public.trending_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  collection_items UUID[] DEFAULT '{}',
  rank INTEGER,
  engagement_score DECIMAL(10, 2),
  is_auto_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- REAL-TIME COLLABORATIVE STUDIO
CREATE TABLE public.collaborative_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE,
  active_editors UUID[] DEFAULT '{}',
  current_version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- LIVESTREAM SESSIONS
CREATE TABLE public.livestream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stream_key TEXT UNIQUE,
  stream_url TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  viewers_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  tips_total DECIMAL(10, 2) DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- WEB3 NFT DROPS
CREATE TABLE public.nft_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_address TEXT,
  token_id TEXT,
  metadata_uri TEXT,
  blockchain TEXT DEFAULT 'ethereum', -- ethereum, polygon, solana
  mint_price DECIMAL(10, 2),
  royalty_percentage DECIMAL(5, 2),
  total_supply INTEGER,
  minted_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'minting', 'sold_out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CREATOR FUND (DAO/Revenue Sharing)
CREATE TABLE public.creator_fund (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0,
  total_earned DECIMAL(10, 2) DEFAULT 0,
  total_withdrawn DECIMAL(10, 2) DEFAULT 0,
  stake_amount DECIMAL(10, 2) DEFAULT 0, -- DAO governance tokens
  governance_votes_count INTEGER DEFAULT 0,
  last_payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ANNOTATIONS (Genius-like feature)
CREATE TABLE public.annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp_start DECIMAL(10, 2),
  timestamp_end DECIMAL(10, 2),
  annotation_text TEXT NOT NULL,
  annotation_type TEXT DEFAULT 'note' CHECK (annotation_type IN ('note', 'story', 'inspiration', 'technique', 'sample_source')),
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CROSS-PLATFORM DISTRIBUTION
CREATE TABLE public.distribution_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platforms TEXT[] DEFAULT '{}', -- spotify, apple_music, youtube, instagram, tiktok, twitter
  scheduled_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'distributed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ENABLE RLS
ALTER TABLE public.creator_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborative_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_schedules ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can view all badges" ON public.creator_badges FOR SELECT USING (true);
CREATE POLICY "Users can manage own marketplace listings" ON public.marketplace_listings FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Users can view active listings" ON public.marketplace_listings FOR SELECT USING (is_active OR auth.uid() = creator_id);
CREATE POLICY "Users can view commissions they're involved in" ON public.commissions FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = client_id);
CREATE POLICY "Users can view own analytics" ON public.creator_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own network" ON public.creator_network FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Users can view own recommendations" ON public.creator_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Trending collections are public" ON public.trending_collections FOR SELECT USING (true);
CREATE POLICY "Collaborators can access collab projects" ON public.collaborative_projects FOR ALL USING (auth.uid() = ANY(active_editors));
CREATE POLICY "Users can view livestreams" ON public.livestream_sessions FOR SELECT USING (true);
CREATE POLICY "Creators can manage own livestreams" ON public.livestream_sessions FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Creators can manage own NFT drops" ON public.nft_drops FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Users can view own fund" ON public.creator_fund FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Annotations are public for public projects" ON public.annotations FOR SELECT USING (true);
CREATE POLICY "Creators manage own distributions" ON public.distribution_schedules FOR ALL USING (auth.uid() = user_id);

-- TRIGGERS
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_creator_analytics_updated_at BEFORE UPDATE ON public.creator_analytics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trending_collections_updated_at BEFORE UPDATE ON public.trending_collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nft_drops_updated_at BEFORE UPDATE ON public.nft_drops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_creator_fund_updated_at BEFORE UPDATE ON public.creator_fund FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_distribution_schedules_updated_at BEFORE UPDATE ON public.distribution_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
