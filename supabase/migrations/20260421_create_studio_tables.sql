-- Create Studios table
CREATE TABLE studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  website TEXT,
  location TEXT,
  bio TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'followers')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id)
);

-- Create Studio Members table
CREATE TABLE studio_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'member')),
  permissions TEXT[] DEFAULT '{"view"}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'removed')),
  invited_at TIMESTAMP DEFAULT now(),
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(studio_id, user_id)
);

-- Create Studio Projects table
CREATE TABLE studio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('planning', 'in_progress', 'completed', 'archived')),
  category TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  team_size INT DEFAULT 1,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'collaborators_only')),
  featured BOOLEAN DEFAULT false,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create Studio Tasks table
CREATE TABLE studio_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES studio_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMP,
  subtasks JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  comments_count INT DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create Studio Assets table
CREATE TABLE studio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID REFERENCES studio_projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_type TEXT,
  file_size INT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  version INT DEFAULT 1,
  is_public BOOLEAN DEFAULT false,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create Studio Activity table
CREATE TABLE studio_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  content JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Create Studio Collaboration table
CREATE TABLE studio_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'comment' CHECK (type IN ('comment', 'feedback', 'mention', 'review')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create Studio Analytics table
CREATE TABLE studio_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  views INT DEFAULT 0,
  visitors INT DEFAULT 0,
  total_downloads INT DEFAULT 0,
  total_likes INT DEFAULT 0,
  engagement_rate DECIMAL(5, 2) DEFAULT 0,
  most_viewed_project UUID REFERENCES studio_projects(id),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_studios_user_id ON studios(user_id);
CREATE INDEX idx_studio_members_studio_id ON studio_members(studio_id);
CREATE INDEX idx_studio_members_user_id ON studio_members(user_id);
CREATE INDEX idx_studio_projects_studio_id ON studio_projects(studio_id);
CREATE INDEX idx_studio_projects_status ON studio_projects(status);
CREATE INDEX idx_studio_tasks_project_id ON studio_tasks(project_id);
CREATE INDEX idx_studio_tasks_assigned_to ON studio_tasks(assigned_to);
CREATE INDEX idx_studio_assets_studio_id ON studio_assets(studio_id);
CREATE INDEX idx_studio_assets_project_id ON studio_assets(project_id);
CREATE INDEX idx_studio_activity_studio_id ON studio_activity(studio_id);
CREATE INDEX idx_studio_collaborations_studio_id ON studio_collaborations(studio_id);
CREATE INDEX idx_studio_analytics_studio_id ON studio_analytics(studio_id);

-- Enable RLS
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Studios: Anyone can view public, owner/members can view private
CREATE POLICY "Studios are viewable by public or members"
  ON studios FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM studio_members WHERE studio_members.studio_id = studios.id AND studio_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own studio"
  ON studios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Studio owners can update their studio"
  ON studios FOR UPDATE
  USING (auth.uid() = user_id);

-- Studio Members
CREATE POLICY "Members are viewable by studio members"
  ON studio_members FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM studios WHERE studios.id = studio_members.studio_id AND studios.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM studio_members sm WHERE sm.studio_id = studio_members.studio_id AND sm.user_id = auth.uid()
  ));

CREATE POLICY "Studio owners can manage members"
  ON studio_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM studios WHERE studios.id = studio_id AND studios.user_id = auth.uid()
  ));

-- Studio Projects
CREATE POLICY "Projects are viewable based on visibility"
  ON studio_projects FOR SELECT
  USING (visibility = 'public' OR EXISTS (
    SELECT 1 FROM studios WHERE studios.id = studio_projects.studio_id AND studios.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM studio_members WHERE studio_members.studio_id = studio_projects.studio_id AND studio_members.user_id = auth.uid() AND studio_members.status = 'active'
  ));

CREATE POLICY "Studio members can create projects"
  ON studio_projects FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM studio_members WHERE studio_members.studio_id = studio_id AND studio_members.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM studios WHERE studios.id = studio_id AND studios.user_id = auth.uid()
  ));

-- Studio Tasks
CREATE POLICY "Tasks are viewable by project members"
  ON studio_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM studio_projects sp 
    WHERE sp.id = studio_tasks.project_id 
    AND (sp.visibility = 'public' OR EXISTS (
      SELECT 1 FROM studios WHERE studios.id = sp.studio_id AND studios.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM studio_members WHERE studio_members.studio_id = sp.studio_id AND studio_members.user_id = auth.uid()
    ))
  ));

-- Studio Assets
CREATE POLICY "Assets are viewable based on project visibility"
  ON studio_assets FOR SELECT
  USING (is_public OR EXISTS (
    SELECT 1 FROM studios WHERE studios.id = studio_assets.studio_id AND studios.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM studio_members WHERE studio_members.studio_id = studio_assets.studio_id AND studio_members.user_id = auth.uid() AND studio_members.status = 'active'
  ) OR (project_id IS NULL AND EXISTS (
    SELECT 1 FROM studio_projects sp WHERE sp.id = studio_assets.project_id AND sp.visibility = 'public'
  )));

-- Studio Activity
CREATE POLICY "Activity is viewable by members"
  ON studio_activity FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM studio_members WHERE studio_members.studio_id = studio_activity.studio_id AND studio_members.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM studios WHERE studios.id = studio_activity.studio_id AND studios.user_id = auth.uid()
  ));

-- Studio Collaborations
CREATE POLICY "Collaborations are viewable by members"
  ON studio_collaborations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM studio_members WHERE studio_members.studio_id = studio_collaborations.studio_id AND studio_members.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM studios WHERE studios.id = studio_collaborations.studio_id AND studios.user_id = auth.uid()
  ));

-- Studio Analytics
CREATE POLICY "Analytics viewable by studio owner/members"
  ON studio_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM studios WHERE studios.id = studio_analytics.studio_id AND studios.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM studio_members WHERE studio_members.studio_id = studio_analytics.studio_id AND studio_members.user_id = auth.uid()
  ));
