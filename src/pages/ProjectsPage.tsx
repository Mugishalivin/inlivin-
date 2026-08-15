import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingCardGrid } from "@/components/LoadingSkeletons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
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
  FolderOpen, Plus, Music, Image, Video, MoreVertical, User,
  Edit, Trash2, Eye, Globe, Lock, Heart, MessageCircle, Upload,
  UserPlus, Users, Search, X, Shield, Pen, EyeIcon, LayoutGrid, List, Sparkles
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("music");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

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

  const projectIds = projects.map(p => p.id);

  const { data: engagement = { likes: {}, comments: {} } } = useQuery({
    queryKey: ["project-engagement", projectIds],
    queryFn: async () => {
      const likes: Record<string, number> = {};
      const comments: Record<string, number> = {};
      const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
        supabase.from("likes").select("project_id").in("project_id", projectIds),
        supabase.from("comments").select("project_id").in("project_id", projectIds),
      ]);
      for (const row of likeRows ?? []) likes[row.project_id as string] = (likes[row.project_id as string] ?? 0) + 1;
      for (const row of commentRows ?? []) comments[row.project_id as string] = (comments[row.project_id as string] ?? 0) + 1;
      return { likes, comments };
    },
    enabled: projectIds.length > 0,
  });

  const { data: collaborators = [] } = useQuery({
    queryKey: ["collaborators", collabOpen],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_collaborators")
        .select("*")
        .eq("project_id", collabOpen!);
      if (!data?.length) return [];
      const userIds = data.map(c => c.user_id as string);
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, username")
        .in("user_id", userIds);
      return data.map(c => ({ ...c, profile: (profs ?? []).find(p => p.user_id === c.user_id) }));
    },
    enabled: !!collabOpen,
  });

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
    setTitle(""); setDescription(""); setCategory("music"); setTags(""); setIsPublic(true); setIsProtected(false); setPassword(""); setCoverFile(null); setEditingProject(null);
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
        is_protected: isProtected,
        password_hash: isProtected && password ? password : null,
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

  const getCategoryIcon = (cat: string) => categories.find(c => c.value === cat)?.icon ?? FolderOpen;

  const applyFilters = (list: any[]) => {
    const term = search.trim().toLowerCase();
    return list.filter(p => {
      const matchesTerm = !term
        || p.title?.toLowerCase().includes(term)
        || p.description?.toLowerCase().includes(term)
        || (p.tags ?? []).some((t: string) => t.toLowerCase().includes(term));
      const matchesCategory = filterCategory === "all" || p.category === filterCategory;
      return matchesTerm && matchesCategory;
    });
  };

  const filteredProjects = useMemo(() => applyFilters(projects), [projects, search, filterCategory]);
  const filteredCollabs = useMemo(() => applyFilters(collabProjects), [collabProjects, search, filterCategory]);

  const stats = [
    { label: "Projects", value: projects.length, icon: FolderOpen },
    { label: "Collaborations", value: collabProjects.length, icon: Users },
    { label: "Public", value: projects.filter(p => p.is_public).length, icon: Globe },
    { label: "Likes", value: Object.values(engagement.likes).reduce((a: number, b: number) => a + b, 0), icon: Heart },
  ];

  const renderProjectCard = (project: any, isCollab = false, collabRole?: string) => {
    const CatIcon = getCategoryIcon(project.category);
    const isList = view === "list";
    return (
      <motion.div
        key={project.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      >
        <Card
          className="border-border/60 bg-card/60 backdrop-blur hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden group cursor-pointer h-full"
          onClick={() => navigate(`/projects/${project.id}`)}
        >
          <CardContent className={`p-0 ${isList ? "flex items-stretch" : ""}`}>
            <div className={`relative overflow-hidden bg-secondary ${isList ? "w-32 shrink-0" : "h-40"}`}>
              {project.cover_url ? (
                <img src={project.cover_url} alt={project.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/40">
                  <CatIcon size={isList ? 22 : 36} className="text-muted-foreground/40" />
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
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-2 left-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => openEdit(project)}><Edit size={14} className="mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCollabOpen(project.id)}><UserPlus size={14} className="mr-2" /> Collaborators</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(project.id)}><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="p-4 flex-1 min-w-0">
              <h3 className="font-display font-bold text-sm text-foreground truncate">{project.title}</h3>
              {project.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-2">{project.description}</p>}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Heart size={12} /> {engagement.likes[project.id] ?? 0}</span>
                <span className="flex items-center gap-1"><MessageCircle size={12} /> {engagement.comments[project.id] ?? 0}</span>
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

  const gridClass = view === "grid"
    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
    : "flex flex-col gap-3";

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-5 md:p-7 mb-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <Sparkles size={12} className="text-primary" /> Creative workspace
            </p>
            <h1 className="font-display text-2xl md:text-4xl font-extrabold text-foreground mt-2">
              Projects<span className="text-primary">.</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm max-w-md">Manage, collaborate on and showcase your creative work.</p>
          </div>
          <Button variant="hero" size="lg" className="w-full md:w-auto" onClick={() => { resetForm(); setOpen(true); }}>
            <Plus size={16} /> New Project
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/60 bg-background/60 backdrop-blur px-3 py-2.5">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <stat.icon size={12} /> {stat.label}
              </div>
              <p className="font-display text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects, tags..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-10 sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="hidden sm:flex items-center gap-1 rounded-lg border border-border p-1">
          <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("grid")}>
            <LayoutGrid size={15} />
          </Button>
          <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("list")}>
            <List size={15} />
          </Button>
        </div>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
            <div className="border rounded-lg p-3 bg-secondary/20">
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" id="protect" checked={isProtected} onChange={e => setIsProtected(e.target.checked)} className="w-4 h-4" />
                <Label htmlFor="protect" className="text-xs font-medium cursor-pointer"><Lock className="w-3 h-3 inline mr-1" />Password Protect This Project</Label>
              </div>
              {isProtected && (
                <Input value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5" placeholder="Set password" type="password" />
              )}
            </div>
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

      {/* Collaborators Dialog */}
      <Dialog open={!!collabOpen} onOpenChange={(v) => { if (!v) { setCollabOpen(null); setInviteSearch(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><Users size={18} /> Collaborators</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
        <LoadingCardGrid count={6} />
      ) : (
        <Tabs defaultValue="mine">
          <TabsList className="mb-5">
            <TabsTrigger value="mine">My Projects ({filteredProjects.length})</TabsTrigger>
            <TabsTrigger value="collabs">Collaborations ({filteredCollabs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="mine">
            {filteredProjects.length > 0 ? (
              <div className={gridClass}>
                {filteredProjects.map(project => renderProjectCard(project))}
              </div>
            ) : (
              <Card className="border-border/50 border-dashed">
                <CardContent className="py-16 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><FolderOpen size={28} className="text-primary" /></div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-1">
                    {projects.length === 0 ? "No projects yet" : "No matching projects"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    {projects.length === 0
                      ? "Create your first project to start building your portfolio."
                      : "Try a different search or category filter."}
                  </p>
                  {projects.length === 0 && (
                    <Button variant="hero" onClick={() => { resetForm(); setOpen(true); }}><Plus size={16} /> Create First Project</Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collabs">
            {filteredCollabs.length > 0 ? (
              <div className={gridClass}>
                {filteredCollabs.map((project: any) => renderProjectCard(project, true, project.collabRole))}
              </div>
            ) : (
              <Card className="border-border/50 border-dashed">
                <CardContent className="py-16 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4"><Users size={28} className="text-accent" /></div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-1">No collaborations yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">Accepted project invitations will appear here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
