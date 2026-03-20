import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FolderOpen, Plus, Music, Image, Video, MoreVertical,
  Edit, Trash2, Eye, Globe, Lock, Heart, MessageCircle, Upload,
  UserPlus, Users, Search, X, Shield, Pen, EyeIcon
} from "lucide-react";

const categories = [
  { value: "music", label: "Music", icon: Music },
  { value: "visual", label: "Visual Art", icon: Image },
  { value: "video", label: "Video", icon: Video },
  { value: "other", label: "Other", icon: FolderOpen },
];

const collabRoles = [
  { value: "editor", label: "Editor", icon: Pen },
  { value: "viewer", label: "Viewer", icon: EyeIcon },
  { value: "contributor", label: "Contributor", icon: Shield },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("music");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["my-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  // Collab projects where I'm invited
  const { data: collabProjects = [] } = useQuery({
    queryKey: ["collab-projects"],
    queryFn: async () => {
      const { data: collabs } = await supabase
        .from("project_collaborators")
        .select("project_id, role, status")
        .eq("user_id", user!.id)
        .eq("status", "accepted");
      if (!collabs?.length) return [];
      const projectIds = collabs.map(c => c.project_id);
      const { data: projs } = await supabase.from("projects").select("*").in("id", projectIds);
      return (projs ?? []).map(p => ({ ...p, collabRole: collabs.find(c => c.project_id === p.id)?.role }));
    },
    enabled: !!user,
  });

  const { data: likeCounts = {} } = useQuery({
    queryKey: ["project-like-counts", projects.map(p => p.id)],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const p of projects) {
        const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("project_id", p.id);
        counts[p.id] = count ?? 0;
      }
      return counts;
    },
    enabled: projects.length > 0,
  });

  const { data: commentCounts = {} } = useQuery({
    queryKey: ["project-comment-counts", projects.map(p => p.id)],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const p of projects) {
        const { count } = await supabase.from("comments").select("*", { count: "exact", head: true }).eq("project_id", p.id);
        counts[p.id] = count ?? 0;
      }
      return counts;
    },
    enabled: projects.length > 0,
  });

  // Collaborators for a project
  const { data: collaborators = [] } = useQuery({
    queryKey: ["collaborators", collabOpen],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_collaborators")
        .select("*")
        .eq("project_id", collabOpen!);
      if (!data?.length) return [];
      const result = [];
      for (const c of data) {
        const { data: prof } = await supabase.from("profiles").select("display_name, avatar_url, username").eq("user_id", c.user_id).single();
        result.push({ ...c, profile: prof });
      }
      return result;
    },
    enabled: !!collabOpen,
  });

  // Search users for invite
  const { data: inviteResults = [] } = useQuery({
    queryKey: ["invite-search", inviteSearch],
    queryFn: async () => {
      if (!inviteSearch.trim()) return [];
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user!.id)
        .or(`display_name.ilike.%${inviteSearch}%,username.ilike.%${inviteSearch}%`)
        .limit(5);
      return data ?? [];
    },
    enabled: inviteSearch.length > 1,
  });

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("music"); setTags(""); setIsPublic(true); setCoverFile(null); setEditingProject(null);
  };

  const openEdit = (project: any) => {
    setEditingProject(project);
    setTitle(project.title);
    setDescription(project.description || "");
    setCategory(project.category || "music");
    setTags((project.tags || []).join(", "));
    setIsPublic(project.is_public);
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let cover_url = editingProject?.cover_url || null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("project-files").upload(path, coverFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
        cover_url = urlData.publicUrl;
      }
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        tags: tags.split(",").map(s => s.trim()).filter(Boolean),
        is_public: isPublic,
        cover_url,
        user_id: user!.id,
      };
      if (editingProject) {
        const { error } = await supabase.from("projects").update(payload).eq("id", editingProject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      toast.success(editingProject ? "Project updated!" : "Project created!");
      setOpen(false); resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      toast.success("Project deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      const { error } = await supabase.from("project_collaborators").insert({
        project_id: projectId,
        user_id: userId,
        invited_by: user!.id,
        role: inviteRole,
        status: "pending",
      });
      if (error) throw error;
      // Send notification
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Project Invitation",
        message: `You've been invited to collaborate on a project`,
        type: "collaboration",
        reference_id: projectId,
        reference_type: "project",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", collabOpen] });
      setInviteSearch("");
      toast.success("Invitation sent!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeCollaborator = useMutation({
    mutationFn: async (collabId: string) => {
      const { error } = await supabase.from("project_collaborators").delete().eq("id", collabId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collaborators", collabOpen] });
      toast.success("Collaborator removed");
    },
  });

  const getCategoryIcon = (cat: string) => {
    const found = categories.find(c => c.value === cat);
    return found ? found.icon : FolderOpen;
  };

  const renderProjectCard = (project: any, isCollab = false, collabRole?: string) => {
    const CatIcon = getCategoryIcon(project.category);
    return (
      <motion.div key={project.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50 hover:border-primary/20 transition-all overflow-hidden group">
          <CardContent className="p-0">
            <div className="h-36 bg-secondary relative overflow-hidden">
              {project.cover_url ? (
                <img src={project.cover_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CatIcon size={36} className="text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-background/80 backdrop-blur text-foreground flex items-center gap-1">
                  {project.is_public ? <Globe size={10} /> : <Lock size={10} />}
                  {project.is_public ? "Public" : "Private"}
                </span>
                {isCollab && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/80 backdrop-blur text-accent-foreground capitalize">{collabRole}</span>
                )}
              </div>
              {!isCollab && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute top-2 left-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => openEdit(project)}><Edit size={14} className="mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCollabOpen(project.id)}><UserPlus size={14} className="mr-2" /> Collaborators</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(project.id)}><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-display font-bold text-sm text-foreground truncate">{project.title}</h3>
              {project.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{project.description}</p>}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Heart size={12} /> {likeCounts[project.id] ?? 0}</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} /> {commentCounts[project.id] ?? 0}</span>
                <span className="flex items-center gap-1 capitalize"><Eye size={12} /> {project.category}</span>
              </div>
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(project.tags as string[]).slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
            Projects<span className="text-primary">.</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and showcase your creative work.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><Plus size={16} /> New Project</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">{editingProject ? "Edit Project" : "New Project"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label className="text-xs font-medium">Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1.5" placeholder="Project name" /></div>
              <div><Label className="text-xs font-medium">Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1.5" placeholder="What's this about?" rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs font-medium">Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs font-medium">Visibility</Label><Select value={isPublic ? "public" : "private"} onValueChange={v => setIsPublic(v === "public")}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="private">Private</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label className="text-xs font-medium">Tags</Label><Input value={tags} onChange={e => setTags(e.target.value)} className="mt-1.5" placeholder="beats, lo-fi, chill (comma separated)" /></div>
              <div>
                <Label className="text-xs font-medium">Cover Image</Label>
                <div className="mt-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Upload size={14} />{coverFile ? coverFile.name : "Choose file..."}
                    <input type="file" accept="image/*" className="hidden" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="hero" onClick={() => saveMutation.mutate()} disabled={!title.trim() || saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingProject ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collaborators Dialog */}
      <Dialog open={!!collabOpen} onOpenChange={(v) => { if (!v) { setCollabOpen(null); setInviteSearch(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><Users size={18} /> Collaborators</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Invite */}
            <div>
              <Label className="text-xs font-medium">Invite Artist</Label>
              <div className="flex gap-2 mt-1.5">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search artists..."
                    className="pl-9 h-9"
                    value={inviteSearch}
                    onChange={e => setInviteSearch(e.target.value)}
                  />
                </div>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {collabRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {inviteResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {inviteResults.map(p => (
                    <button
                      key={p.id}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 text-left text-sm"
                      onClick={() => collabOpen && inviteMutation.mutate({ projectId: collabOpen, userId: p.user_id })}
                    >
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={12} className="text-muted-foreground" />}
                      </div>
                      <span>{p.display_name || "Artist"}</span>
                      <UserPlus size={14} className="ml-auto text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current Collaborators */}
            <div>
              <Label className="text-xs font-medium">Current Collaborators</Label>
              <div className="mt-2 space-y-2">
                {collaborators.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No collaborators yet</p>
                ) : (
                  collaborators.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {c.profile?.avatar_url ? <img src={c.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={12} className="text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.profile?.display_name || "Artist"}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{c.role} · {c.status}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeCollaborator.mutate(c.id)}>
                        <X size={14} />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-border/50 animate-pulse">
              <CardContent className="p-0"><div className="h-36 bg-muted rounded-t-lg" /><div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-2/3" /><div className="h-3 bg-muted rounded w-1/2" /></div></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* My Projects */}
          {projects.length > 0 ? (
            <div>
              <h2 className="font-display font-bold text-lg mb-4">My Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => renderProjectCard(project))}
              </div>
            </div>
          ) : (
            <Card className="border-border/50 border-dashed">
              <CardContent className="py-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><FolderOpen size={28} className="text-primary" /></div>
                <h3 className="font-display font-bold text-lg text-foreground mb-1">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">Create your first project to start building your portfolio.</p>
                <Button variant="hero" onClick={() => setOpen(true)}><Plus size={16} /> Create First Project</Button>
              </CardContent>
            </Card>
          )}

          {/* Collaboration Projects */}
          {collabProjects.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <Users size={18} className="text-accent" /> Collaborations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {collabProjects.map((project: any) => renderProjectCard(project, true, project.collabRole))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
