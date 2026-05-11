// Studio types and interfaces
export interface Studio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
  website?: string;
  location?: string;
  bio?: string;
  visibility: 'public' | 'private' | 'followers';
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface StudioMember {
  id: string;
  studio_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'member';
  permissions: string[];
  status: 'active' | 'invited' | 'removed';
  invited_at: string;
  joined_at?: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
}

export interface StudioProject {
  id: string;
  studio_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'archived';
  category?: string;
  start_date?: string;
  end_date?: string;
  team_size: number;
  visibility: 'public' | 'private' | 'collaborators_only';
  featured: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface StudioTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  due_date?: string;
  subtasks?: any[];
  attachments?: any[];
  comments_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StudioAsset {
  id: string;
  studio_id: string;
  project_id?: string;
  name: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  file_type?: string;
  file_size?: number;
  category?: string;
  tags?: string[];
  version: number;
  is_public: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface StudioActivity {
  id: string;
  studio_id: string;
  user_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  content?: any;
  created_at: string;
  user?: {
    id: string;
    user_metadata?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
}

export interface StudioAnalytics {
  id: string;
  studio_id: string;
  views: number;
  visitors: number;
  total_downloads: number;
  total_likes: number;
  engagement_rate: number;
  most_viewed_project?: string;
  date: string;
  created_at: string;
}
