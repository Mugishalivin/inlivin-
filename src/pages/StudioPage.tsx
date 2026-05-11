import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { studioApi } from "@/lib/studio-api";
import {
  Studio,
  StudioMember,
  StudioProject,
  StudioAsset,
  StudioActivity,
  StudioAnalytics as StudioAnalyticsType,
} from "@/types/studio";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { MembersPanel } from "@/components/studio/MembersPanel";
import { ProjectsSection } from "@/components/studio/ProjectsSection";
import { AssetLibrary } from "@/components/studio/AssetLibrary";
import { ActivityFeed } from "@/components/studio/ActivityFeed";
import { StudioAnalyticsComponent } from "@/components/studio/StudioAnalytics";
import { toast } from "sonner";
import { Loader } from "lucide-react";

export default function StudioPage() {
  const { studioId } = useParams<{ studioId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [studio, setStudio] = useState<Studio | null>(null);
  const [members, setMembers] = useState<StudioMember[]>([]);
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [assets, setAssets] = useState<StudioAsset[]>([]);
  const [activities, setActivities] = useState<StudioActivity[]>([]);
  const [analytics, setAnalytics] = useState<StudioAnalyticsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Load studio data
  useEffect(() => {
    const loadStudioData = async () => {
      if (!studioId) {
        setLoading(false);
        return;
      }

      try {
        const studioData = await studioApi.getStudio(studioId);
        if (!studioData) {
          toast.error("Studio not found");
          navigate("/");
          return;
        }

        setStudio(studioData);
        setIsOwner(user?.id === studioData.user_id);

        // Load all studio data in parallel
        const [membersData, projectsData, assetsData, activitiesData, analyticsData] =
          await Promise.all([
            studioApi.getStudioMembers(studioId),
            studioApi.getStudioProjects(studioId),
            studioApi.getStudioAssets(studioId),
            studioApi.getStudioActivity(studioId),
            studioApi.getStudioAnalytics(studioId),
          ]);

        setMembers(membersData);
        setProjects(projectsData);
        setAssets(assetsData);
        setActivities(activitiesData);
        setAnalytics(analyticsData);

        // Increment views
        await studioApi.incrementViews(studioId);
      } catch (error) {
        console.error("Error loading studio:", error);
        toast.error("Failed to load studio");
      } finally {
        setLoading(false);
      }
    };

    loadStudioData();
  }, [studioId, user, navigate]);

  // Create or get user's own studio
  const handleCreateStudio = async () => {
    if (!user) return;
    try {
      const newStudio = await studioApi.createStudio({
        user_id: user.id,
        name: user.user_metadata?.display_name || user.email || "My Studio",
        visibility: "public",
      });
      if (newStudio) {
        navigate(`/studio/${newStudio.id}`);
        toast.success("Studio created successfully!");
      }
    } catch (error) {
      console.error("Error creating studio:", error);
      toast.error("Failed to create studio");
    }
  };

  // Handle studio updates
  const handleUpdateStudio = async (updates: Partial<Studio>) => {
    if (!studio) return;
    try {
      const updated = await studioApi.updateStudio(studio.id, updates);
      if (updated) {
        setStudio(updated);
        toast.success("Studio updated successfully!");

        // Log activity
        await studioApi.logActivity({
          studio_id: studio.id,
          user_id: user?.id,
          action: "updated_studio",
          content: updates,
        });
      }
    } catch (error) {
      console.error("Error updating studio:", error);
      toast.error("Failed to update studio");
    }
  };

  // Handle member operations
  const handleAddMember = async (email: string, role: string) => {
    if (!studio) return;
    try {
      // In a real app, you'd look up the user by email first
      // For now, we'll create an invitation
      const newMember = await studioApi.addStudioMember(studio.id, user?.id || "", role);
      if (newMember) {
        setMembers([...members, newMember]);
        toast.success("Invitation sent!");

        await studioApi.logActivity({
          studio_id: studio.id,
          user_id: user?.id,
          action: "added_member",
          content: { email, role },
        });
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!studio) return;
    try {
      const success = await studioApi.removeMember(memberId);
      if (success) {
        setMembers(members.filter((m) => m.id !== memberId));
        toast.success("Member removed");

        await studioApi.logActivity({
          studio_id: studio.id,
          user_id: user?.id,
          action: "removed_member",
        });
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: string) => {
    if (!studio) return;
    try {
      const updated = await studioApi.updateMemberRole(memberId, role);
      if (updated) {
        setMembers(members.map((m) => (m.id === memberId ? updated : m)));
        toast.success("Member role updated");

        await studioApi.logActivity({
          studio_id: studio.id,
          user_id: user?.id,
          action: "updated_member_role",
          content: { memberId, role },
        });
      }
    } catch (error) {
      console.error("Error updating member role:", error);
      toast.error("Failed to update member role");
    }
  };

  // Handle project operations
  const handleCreateProject = async (project: Partial<StudioProject>) => {
    if (!studio) return;
    try {
      const newProject = await studioApi.createProject({
        ...project,
        studio_id: studio.id,
      });
      if (newProject) {
        setProjects([newProject, ...projects]);
        toast.success("Project created successfully!");

        await studioApi.logActivity({
          studio_id: studio.id,
          user_id: user?.id,
          action: "created_project",
          content: { name: project.name, description: project.description },
        });
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    }
  };

  const handleUpdateProject = async (
    projectId: string,
    updates: Partial<StudioProject>
  ) => {
    try {
      const updated = await studioApi.updateProject(projectId, updates);
      if (updated) {
        setProjects(projects.map((p) => (p.id === projectId ? updated : p)));
        toast.success("Project updated!");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  // Handle asset operations
  const handleUploadAsset = async (
    file: File,
    metadata: Partial<StudioAsset>
  ) => {
    if (!studio) return;
    try {
      // In a real app, upload file to storage first
      // For now, we'll create an asset record with placeholder URL
      const newAsset = await studioApi.uploadAsset({
        ...metadata,
        studio_id: studio.id,
        file_url: URL.createObjectURL(file),
        uploaded_by: user?.id,
        version: 1,
      });
      if (newAsset) {
        setAssets([newAsset, ...assets]);
        toast.success("Asset uploaded successfully!");

        await studioApi.logActivity({
          studio_id: studio.id,
          user_id: user?.id,
          action: "uploaded_asset",
          content: { name: metadata.name },
        });
      }
    } catch (error) {
      console.error("Error uploading asset:", error);
      toast.error("Failed to upload asset");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-violet-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading studio...</p>
        </div>
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">No studio found</p>
          {user && (
            <button
              onClick={handleCreateStudio}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold transition-colors"
            >
              Create Your Studio
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <StudioHeader
          studio={studio}
          isOwner={isOwner}
          memberCount={members.filter((m) => m.status === "active").length}
          projectCount={projects.filter((p) => p.status !== "archived").length}
          onUpdate={handleUpdateStudio}
        />

        {/* Tabs */}
        <Tabs defaultValue="projects" className="mt-8">
          <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-6">
            <ProjectsSection
              projects={projects}
              isOwner={isOwner}
              onCreateProject={handleCreateProject}
              onUpdateProject={handleUpdateProject}
              onSelectProject={handleSelectProject}
            />
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="mt-6">
            <AssetLibrary
              assets={assets}
              isOwner={isOwner}
              onUploadAsset={handleUploadAsset}
            />
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="mt-6">
            <MembersPanel
              members={members}
              isOwner={isOwner}
              currentUserId={user?.id || ""}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onUpdateRole={handleUpdateMemberRole}
            />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <ActivityFeed activities={activities} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <StudioAnalyticsComponent analytics={analytics} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
