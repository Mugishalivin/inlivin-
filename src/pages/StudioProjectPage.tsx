import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { studioApi } from "@/lib/studio-api";
import { StudioProject, StudioAsset } from "@/types/studio";
import { toast } from "sonner";
import { Loader, ArrowLeft, Share2, Eye, Download, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioHeader } from "@/components/studio/StudioHeader";
import { ProjectComments } from "@/components/studio/ProjectComments";
import { AssetTimeline } from "@/components/studio/AssetTimeline";
import { FullscreenViewer } from "@/components/studio/FullscreenViewer";
import { ShareableLink } from "@/components/studio/ShareableLink";
import { Whiteboard } from "@/components/studio/Whiteboard";
import { Slideshow } from "@/components/studio/Slideshow";
import { Gallery3D } from "@/components/studio/Gallery3D";
import { CollaborationStatus } from "@/components/studio/CollaborationStatus";
import { ProjectMetrics } from "@/components/studio/ProjectMetrics";

export default function StudioProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<StudioProject | null>(null);
  const [assets, setAssets] = useState<StudioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenItem, setFullscreenItem] = useState<any>(null);
  const [slideshowItems, setSlideshowItems] = useState<any[]>([]);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [liked, setLiked] = useState(false);

  // Load project data
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        const projectData = await (studioApi as any).getProject(projectId);
        if (!projectData) {
          toast.error("Project not found");
          navigate("/studio");
          return;
        }

        setProject(projectData);

        // Load project assets
        if (projectData.studio_id) {
          const projectAssets = await (studioApi as any).getProjectAssets(projectId);
          setAssets(projectAssets);
        }
      } catch (error) {
        console.error("Error loading project:", error);
        toast.error("Failed to load project");
        navigate("/studio");
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId, navigate]);

  // Start slideshow with images
  const handleStartSlideshow = () => {
    const images = assets.filter((a) => a.file_type?.startsWith("image"));
    if (images.length === 0) {
      toast.error("No images in this project");
      return;
    }
    setSlideshowItems(
      images.map((img) => ({
        id: img.id,
        url: img.file_url,
        title: img.name,
        description: img.description,
      }))
    );
    setShowSlideshow(true);
  };

  // Open video in fullscreen viewer
  const handleOpenVideo = () => {
    const videos = assets.filter((a) => a.file_type?.startsWith("video"));
    if (videos.length > 0) {
      const video = videos[0];
      setFullscreenItem({
        url: video.file_url,
        name: video.name,
        type: "video",
      });
    } else {
      toast.error("No videos in this project");
    }
  };

  const handleUpdateProject = async (updates: Partial<StudioProject>) => {
    if (!project) return;
    try {
      const updated = await studioApi.updateProject(project.id, updates);
      if (updated) {
        setProject(updated);
        toast.success("Project updated!");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-violet-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">Project not found</p>
          <Button onClick={() => navigate("/studio")}>Back to Studio</Button>
        </div>
      </div>
    );
  }

  const hasImages = assets.some((a) => a.file_type?.startsWith("image"));
  const hasVideos = assets.some((a) => a.file_type?.startsWith("video"));
  const has3DAssets = assets.some((a) => a.file_type?.includes("3d") || a.file_type?.includes("obj") || a.file_type?.includes("glb"));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/studio")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Project Title & Info */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 mb-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {project.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                {project.description}
              </p>
            </div>
            <div
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium gap-2"
              style={{
                backgroundColor:
                  project.status === "completed"
                    ? "rgb(220, 252, 231)"
                    : project.status === "in_progress"
                      ? "rgb(254, 243, 199)"
                      : "rgb(226, 232, 240)",
                color:
                  project.status === "completed"
                    ? "rgb(5, 150, 105)"
                    : project.status === "in_progress"
                      ? "rgb(180, 83, 9)"
                      : "rgb(51, 65, 85)",
              }}
            >
              {project.status?.replace("_", " ").toUpperCase()}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Eye className="w-4 h-4" />
              {project.views || 0} views
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Download className="w-4 h-4" />
              {(project as any).downloads || 0} downloads
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Heart className="w-4 h-4" />
              {(project as any).likes || 0} likes
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <MessageSquare className="w-4 h-4" />
              {(project as any).comments_count || 0} comments
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {hasImages && (
            <Button onClick={handleStartSlideshow} variant="default" className="gap-2">
              ▶ Start Slideshow
            </Button>
          )}
          {hasVideos && (
            <Button onClick={handleOpenVideo} variant="outline" className="gap-2">
              ▶ Play Video
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share Project
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="gallery" className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            {hasVideos && <TabsTrigger value="videos">Videos</TabsTrigger>}
            {has3DAssets && <TabsTrigger value="3d">3D View</TabsTrigger>}
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="collab">Collaboration</TabsTrigger>
          </TabsList>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => {
                    setFullscreenItem({
                      url: asset.file_url,
                      name: asset.name,
                      type: asset.file_type?.startsWith("image")
                        ? "image"
                        : asset.file_type?.startsWith("video")
                          ? "video"
                          : "pdf",
                    });
                  }}
                >
                  {asset.file_type?.startsWith("image") && (
                    <img
                      src={asset.file_url}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  )}
                  {asset.file_type?.startsWith("video") && (
                    <video
                      src={asset.file_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      ▶
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-white text-xs line-clamp-1">{asset.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          {hasVideos && (
            <TabsContent value="videos" className="mt-6">
              <div className="space-y-4">
                {assets
                  .filter((a) => a.file_type?.startsWith("video"))
                  .map((video) => (
                    <div
                      key={video.id}
                      className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      onClick={() => {
                        setFullscreenItem({
                          url: video.file_url,
                          name: video.name,
                          type: "video",
                        });
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-slate-300 dark:bg-slate-700 rounded flex items-center justify-center">
                          ▶
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {video.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {video.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          )}

          {/* 3D Gallery Tab */}
          {has3DAssets && (
            <TabsContent value="3d" className="mt-6">
              <Gallery3D {...({} as any)}
                assets={assets.filter(
                  (a) =>
                    a.file_type?.includes("3d") ||
                    a.file_type?.includes("obj") ||
                    a.file_type?.includes("glb")
                )}
              />
            </TabsContent>
          )}

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-6">
            <AssetTimeline
              assets={assets}
              onSelectAsset={(asset) => {
                setFullscreenItem({
                  url: asset.file_url,
                  name: asset.name,
                  type: asset.file_type?.startsWith("image")
                    ? "image"
                    : asset.file_type?.startsWith("video")
                      ? "video"
                      : "pdf",
                });
              }}
            />
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="mt-6">
            <ProjectComments {...({ projectId: project.id } as any)} />
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collab" className="mt-6">
            <CollaborationStatus {...({ projectId: project.id } as any)} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Fullscreen Viewer Modal */}
      {fullscreenItem && (
        <FullscreenViewer
          item={fullscreenItem}
          onClose={() => setFullscreenItem(null)}
        />
      )}

      {/* Slideshow Modal */}
      {showSlideshow && (
        <Slideshow items={slideshowItems} onClose={() => setShowSlideshow(false)} />
      )}
    </div>
  );
}
