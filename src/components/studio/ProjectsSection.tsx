import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Plus, Archive, Eye, Calendar, Users, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StudioProject } from "@/types/studio";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectsSectionProps {
  projects: StudioProject[];
  isOwner: boolean;
  onCreateProject?: (project: Partial<StudioProject>) => Promise<void>;
  onUpdateProject?: (projectId: string, updates: Partial<StudioProject>) => Promise<void>;
  onSelectProject?: (projectId: string) => void;
}

const statusColors = {
  planning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  archived: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

export function ProjectsSection({
  projects,
  isOwner,
  onCreateProject,
  onUpdateProject,
  onSelectProject,
}: ProjectsSectionProps) {
  const navigate = useNavigate();
  const [openCreateProject, setOpenCreateProject] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    visibility: "private" as const,
  });
  const [loading, setLoading] = useState(false);

  const handleCreateProject = async () => {
    if (!formData.name) return;
    setLoading(true);
    try {
      await onCreateProject?.({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        visibility: formData.visibility,
        status: "planning",
        team_size: 1,
      });
      setFormData({ name: "", description: "", category: "", visibility: "private" });
      setOpenCreateProject(false);
    } finally {
      setLoading(false);
    }
  };

  const activeProjects = projects.filter((p) => p.status !== "archived");
  const archivedProjects = projects.filter((p) => p.status === "archived");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Projects</h3>
          <span className="ml-2 px-3 py-1 bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200 rounded-full text-sm font-medium">
            {activeProjects.length}
          </span>
        </div>
        {isOwner && (
          <Button size="sm" onClick={() => setOpenCreateProject(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Active Projects Grid */}
      {activeProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeProjects.map((project) => (
            <div
              key={project.id}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:border-violet-400 dark:hover:border-violet-600 cursor-pointer"
              onClick={() => navigate(`/studio/project/${project.id}`)}
            >
              {/* Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-violet-500 to-purple-600 relative overflow-hidden">
                {project.thumbnail_url ? (
                  <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderOpen className="w-16 h-16 text-white opacity-20" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-white truncate flex-1">
                    {project.name}
                  </h4>
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onUpdateProject?.(project.id, { featured: !project.featured })}>
                          {project.featured ? "Unfeature" : "Feature"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateProject?.(project.id, { visibility: "public" })}>
                          Make Public
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateProject?.(project.id, { status: "archived" })}>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {project.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={project.status === "completed" ? "default" : "outline"}>
                    {project.status.replace("_", " ")}
                  </Badge>
                  {project.category && (
                    <Badge variant="secondary">{project.category}</Badge>
                  )}
                  {project.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">★ Featured</Badge>
                  )}
                </div>

                <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {project.team_size}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {project.views}
                  </div>
                  {project.end_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(project.end_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">No projects yet. Start creating!</p>
          {isOwner && (
            <Button size="sm" variant="outline" onClick={() => setOpenCreateProject(true)} className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Create First Project
            </Button>
          )}
        </div>
      )}

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Archived Projects ({archivedProjects.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
            {archivedProjects.map((project) => (
              <div key={project.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="font-medium text-slate-900 dark:text-white">{project.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Archived</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={openCreateProject} onOpenChange={setOpenCreateProject}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Project Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Awesome Project"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your project..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Category
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Design, Development"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                  Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="private">Private</option>
                  <option value="collaborators_only">Collaborators Only</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setOpenCreateProject(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={loading || !formData.name}>
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
