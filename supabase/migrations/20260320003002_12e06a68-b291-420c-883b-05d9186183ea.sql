
-- Project collaborators table
CREATE TABLE public.project_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Everyone can see collaborators of public projects
CREATE POLICY "Collaborators viewable by project members" ON public.project_collaborators
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  invited_by = auth.uid() OR
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (is_public = true OR user_id = auth.uid()))
);

-- Project owners can invite
CREATE POLICY "Project owners can invite collaborators" ON public.project_collaborators
FOR INSERT TO authenticated
WITH CHECK (
  invited_by = auth.uid() AND
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

-- Project owners and collaborators themselves can update
CREATE POLICY "Collaborators can update own status" ON public.project_collaborators
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

-- Project owners can remove collaborators
CREATE POLICY "Project owners can remove collaborators" ON public.project_collaborators
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

-- Add trigger for updated_at
CREATE TRIGGER update_project_collaborators_updated_at
  BEFORE UPDATE ON public.project_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for collaborators
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_collaborators;
