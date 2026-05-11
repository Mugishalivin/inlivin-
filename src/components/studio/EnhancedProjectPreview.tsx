import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioProject, StudioAsset } from "@/types/studio";
import { Gallery3D } from "@/components/studio/Gallery3D";
import { ProjectMetrics } from "@/components/studio/ProjectMetrics";
import { ProjectComments } from "@/components/studio/ProjectComments";
import { AssetTimeline } from "@/components/studio/AssetTimeline";
import { FullscreenViewer } from "@/components/studio/FullscreenViewer";
import { ShareableLink } from "@/components/studio/ShareableLink";
import { Whiteboard } from "@/components/studio/Whiteboard";
import { Slideshow } from "@/components/studio/Slideshow";
import { CollaborationStatus } from "@/components/studio/CollaborationStatus";
import { motion } from "framer-motion";

interface EnhancedProjectPreviewProps {
  project?: StudioProject;
  assets?: StudioAsset[];
  onUpdate?: (updates: Partial<StudioProject>) => Promise<void>;
}

export function EnhancedProjectPreview({
  project,
  assets = [],
  onUpdate,
}: EnhancedProjectPreviewProps) {
  const navigate = useNavigate();
  const [fullscreenItem, setFullscreenItem] = useState<any>(null);
  const [annotatingImage, setAnnotatingImage] = useState<any>(null);
  const [slideshowItems, setSlideshowItems] = useState<any[]>([]);
  const [showSlideshow, setShowSlideshow] = useState(false);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">Project not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const imageAssets = assets.filter((a) => a.file_type?.startsWith("image"));
  const videoAssets = assets.filter((a) => a.file_type?.startsWith("video"));
  const allMediaAssets = [
    ...imageAssets.map((a) => ({ ...a, type: "image" as const })),
    ...videoAssets.map((a) => ({ ...a, type: "video" as const })),
  ];

  const handleStartSlideshow = () => {
    setSlideshowItems(imageAssets.map((asset) => ({
      id: asset.id,
      url: asset.file_url,
      title: asset.name,
      description: asset.description,
    })));
    setShowSlideshow(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <ShareableLink
              projectId={project.id}
              projectName={project.name}
              currentVisibility={project.visibility}
              onVisibilityChange={(visibility) =>
                onUpdate?.({ ...project, visibility: visibility as any })
              }
            />
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="gallery" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          </TabsList>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            {allMediaAssets.length > 0 ? (
              <>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Gallery3D
                    items={allMediaAssets as any}
                    onFullscreen={(item) => setFullscreenItem(item)}
                  />
                </motion.div>

                {imageAssets.length > 1 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartSlideshow}
                      variant="outline"
                      className="gap-2"
                    >
                      📊 Start Slideshow
                    </Button>
                    {imageAssets.length > 0 && (
                      <Button
                        onClick={() => setAnnotatingImage(imageAssets[0])}
                        variant="outline"
                        className="gap-2"
                      >
                        ✏️ Annotate
                      </Button>
                    )}
                  </div>
                )}

                {/* Thumbnail Grid */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                >
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group cursor-pointer rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 aspect-square hover:shadow-lg transition-shadow"
                      onClick={() => setFullscreenItem(asset)}
                    >
                      {asset.thumbnail_url ? (
                        <img
                          src={asset.thumbnail_url}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              </>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
                <p className="text-slate-600 dark:text-slate-400">No media assets yet</p>
              </div>
            )}
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ProjectMetrics
                views={project.views || 0}
                likes={0}
                comments={0}
                shares={0}
                downloads={0}
                engagementRate={0}
                trend="up"
              />
            </motion.div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <AssetTimeline assets={assets} />
            </motion.div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <ProjectComments comments={[]} canComment={true} />
            </motion.div>
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaboration">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <CollaborationStatus
                members={[]}
                isLive={true}
                recentActivity={[]}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fullscreen Viewer */}
      {fullscreenItem && (
        <FullscreenViewer
          item={fullscreenItem}
          onClose={() => setFullscreenItem(null)}
        />
      )}

      {/* Whiteboard */}
      {annotatingImage && (
        <Whiteboard
          imageUrl={annotatingImage.file_url}
          imageName={annotatingImage.name}
          onClose={() => setAnnotatingImage(null)}
          onSaveAnnotation={async (annotated) => {
            // Save annotated image
            setAnnotatingImage(null);
          }}
        />
      )}

      {/* Slideshow */}
      {showSlideshow && (
        <Slideshow
          items={slideshowItems}
          onClose={() => setShowSlideshow(false)}
        />
      )}
    </motion.div>
  );
}
