import { supabase } from "@/integrations/supabase/client";
import { Studio, StudioMember, StudioProject, StudioTask, StudioAsset, StudioActivity } from "@/types/studio";

// Studio Operations
export const studioApi = {
  // Studios
  async getStudio(studioId: string): Promise<Studio | null> {
    const { data, error } = await supabase
      .from("studios")
      .select("*")
      .eq("id", studioId)
      .single();
    
    if (error) {
      console.error("Error fetching studio:", error);
      return null;
    }
    return data as Studio;
  },

  async getUserStudio(userId: string): Promise<Studio | null> {
    const { data, error } = await supabase
      .from("studios")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching user studio:", error);
      return null;
    }
    return data as Studio;
  },

  async createStudio(studio: Partial<Studio>): Promise<Studio | null> {
    const { data, error } = await supabase
      .from("studios")
      .insert([studio])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating studio:", error);
      return null;
    }
    
    // Add owner as first member
    if (data) {
      await supabase.from("studio_members").insert([{
        studio_id: data.id,
        user_id: data.user_id,
        role: "owner",
        permissions: ["all"],
        status: "active",
        joined_at: new Date().toISOString(),
      }]);
    }
    
    return data as Studio;
  },

  async updateStudio(studioId: string, updates: Partial<Studio>): Promise<Studio | null> {
    const { data, error } = await supabase
      .from("studios")
      .update(updates)
      .eq("id", studioId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating studio:", error);
      return null;
    }
    return data as Studio;
  },

  // Members
  async getStudioMembers(studioId: string): Promise<StudioMember[]> {
    const { data, error } = await supabase
      .from("studio_members")
      .select(`
        *,
        user:auth.users(id, email, user_metadata)
      `)
      .eq("studio_id", studioId)
      .order("joined_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching studio members:", error);
      return [];
    }
    return (data || []) as StudioMember[];
  },

  async addStudioMember(studioId: string, userId: string, role: string = "member"): Promise<StudioMember | null> {
    const { data, error } = await supabase
      .from("studio_members")
      .insert([{
        studio_id: studioId,
        user_id: userId,
        role,
        status: "invited",
        permissions: ["view"],
      }])
      .select()
      .single();
    
    if (error) {
      console.error("Error adding studio member:", error);
      return null;
    }
    return data as StudioMember;
  },

  async updateMemberRole(memberId: string, role: string): Promise<StudioMember | null> {
    const { data, error } = await supabase
      .from("studio_members")
      .update({ role })
      .eq("id", memberId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating member role:", error);
      return null;
    }
    return data as StudioMember;
  },

  async removeMember(memberId: string): Promise<boolean> {
    const { error } = await supabase
      .from("studio_members")
      .delete()
      .eq("id", memberId);
    
    if (error) {
      console.error("Error removing member:", error);
      return false;
    }
    return true;
  },

  // Projects
  async getStudioProjects(studioId: string): Promise<StudioProject[]> {
    const { data, error } = await supabase
      .from("studio_projects")
      .select("*")
      .eq("studio_id", studioId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching studio projects:", error);
      return [];
    }
    return (data || []) as StudioProject[];
  },

  async createProject(project: Partial<StudioProject>): Promise<StudioProject | null> {
    const { data, error } = await supabase
      .from("studio_projects")
      .insert([project])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating project:", error);
      return null;
    }
    return data as StudioProject;
  },

  async updateProject(projectId: string, updates: Partial<StudioProject>): Promise<StudioProject | null> {
    const { data, error } = await supabase
      .from("studio_projects")
      .update(updates)
      .eq("id", projectId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating project:", error);
      return null;
    }
    return data as StudioProject;
  },

  // Tasks
  async getProjectTasks(projectId: string): Promise<StudioTask[]> {
    const { data, error } = await supabase
      .from("studio_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
    return (data || []) as StudioTask[];
  },

  async createTask(task: Partial<StudioTask>): Promise<StudioTask | null> {
    const { data, error } = await supabase
      .from("studio_tasks")
      .insert([task])
      .select()
      .single();
    
    if (error) {
      console.error("Error creating task:", error);
      return null;
    }
    return data as StudioTask;
  },

  async updateTask(taskId: string, updates: Partial<StudioTask>): Promise<StudioTask | null> {
    const { data, error } = await supabase
      .from("studio_tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating task:", error);
      return null;
    }
    return data as StudioTask;
  },

  // Assets
  async getStudioAssets(studioId: string): Promise<StudioAsset[]> {
    const { data, error } = await supabase
      .from("studio_assets")
      .select("*")
      .eq("studio_id", studioId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching assets:", error);
      return [];
    }
    return (data || []) as StudioAsset[];
  },

  async uploadAsset(asset: Partial<StudioAsset>): Promise<StudioAsset | null> {
    const { data, error } = await supabase
      .from("studio_assets")
      .insert([asset])
      .select()
      .single();
    
    if (error) {
      console.error("Error uploading asset:", error);
      return null;
    }
    return data as StudioAsset;
  },

  // Activity
  async getStudioActivity(studioId: string, limit = 50): Promise<StudioActivity[]> {
    const { data, error } = await supabase
      .from("studio_activity")
      .select(`
        *,
        user:auth.users(id, user_metadata)
      `)
      .eq("studio_id", studioId)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching activity:", error);
      return [];
    }
    return (data || []) as StudioActivity[];
  },

  async logActivity(activity: Partial<StudioActivity>): Promise<StudioActivity | null> {
    const { data, error } = await supabase
      .from("studio_activity")
      .insert([activity])
      .select()
      .single();
    
    if (error) {
      console.error("Error logging activity:", error);
      return null;
    }
    return data as StudioActivity;
  },

  // Analytics
  async getStudioAnalytics(studioId: string) {
    const { data, error } = await supabase
      .from("studio_analytics")
      .select("*")
      .eq("studio_id", studioId)
      .order("date", { ascending: false })
      .limit(30);
    
    if (error) {
      console.error("Error fetching analytics:", error);
      return [];
    }
    return data;
  },

  async incrementViews(studioId: string) {
    const { data: analytics } = await supabase
      .from("studio_analytics")
      .select("*")
      .eq("studio_id", studioId)
      .eq("date", new Date().toISOString().split('T')[0])
      .single();
    
    if (analytics) {
      await supabase
        .from("studio_analytics")
        .update({ views: (analytics.views || 0) + 1 })
        .eq("id", analytics.id);
    } else {
      await supabase.from("studio_analytics").insert([{
        studio_id: studioId,
        views: 1,
        visitors: 1,
        total_downloads: 0,
        total_likes: 0,
        engagement_rate: 0,
      }]);
    }
  },
};
