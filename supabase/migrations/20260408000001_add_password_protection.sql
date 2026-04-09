-- Add password protection to projects and tasks

-- Projects: Add password and is_protected columns
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create a tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMP,
  is_protected BOOLEAN DEFAULT false,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create basic policies for tasks
CREATE POLICY "Users can view own project tasks" ON public.tasks 
  FOR SELECT USING (auth.uid() = user_id OR project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own tasks" ON public.tasks 
  FOR ALL USING (auth.uid() = user_id OR project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  ));

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create basic policies for teams
CREATE POLICY "Team members can view" ON public.teams 
  FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = ANY(member_ids));

CREATE POLICY "Creator can manage team" ON public.teams 
  FOR ALL USING (auth.uid() = creator_id);

-- Create collaboration_requests table
CREATE TABLE IF NOT EXISTS public.collaboration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);

-- Enable RLS on collaboration_requests
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Create basic policies for collaboration_requests
CREATE POLICY "Users can view own requests" ON public.collaboration_requests 
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can manage own requests" ON public.collaboration_requests 
  FOR ALL USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
