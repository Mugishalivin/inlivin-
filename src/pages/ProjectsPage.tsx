import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingCardGrid } from "@/components/LoadingSkeletons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  FolderOpen, Plus, Music, Image, Video, Globe, Heart,
  Users, Search, LayoutGrid, List, Sparkles, Mail, ArrowUpDown,
} from "lucide-react";
import { CategoryFolders, type FolderCategory } from "@/components/projects/CategoryFolders";
import { ProjectCard, type ProjectCardData } from "@/components/projects/ProjectCard";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { CollaboratorsDialog } from "@/components/projects/CollaboratorsDialog";
import { InvitationsPanel } from "@/components/projects/InvitationsPanel";

const categories: FolderCategory[] = [
  { value: "music", label: "Music", icon: Music },
  { value: "visual", label: "Visual Art", icon: Image },
  { value: "video", label: "Video", icon: Video },
  { value: "other", label: "Other", icon: FolderOpen },
];

const collabRoles = [
  { value: "editor", label: "Editor", icon: FolderOpen },
  { value: "viewer", label: "Viewer", icon: FolderOpen },
  { value: "contributor", label: "Contributor", icon: FolderOpen },
];

type SortKey = "newest" | "oldest" | "title";

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
  const [sort, setSort] = useState<SortKey>("newest");
  const [activeTab, setActiveTab] = useState("mine");

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

  const { data: collabRows = [] } = useQuery({
    queryKey: ["collab-projects-raw"],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_collaborators")
        .select("id, project_id, role, status")
        .eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const acceptedCollabRows = useMemo(() => collabRows.filter(c => c.status === "accepted"), [collabRows]);
  const pendingCollabRows = useMemo(() => collabRows.filter(c => c.status === "pending"), [collabRows]);

  const allCollabProjectIds = useMemo(() => [...new Set(collabRows.map(c => c.project_id))], [collabRows]);

  const { data: collabProjectsById = {} } = useQuery({
    queryKey: ["collab-projects-lookup", allCollabProjectIds],
    queryFn: async () => {
      if (!allCollabProjectIds.length) return {} as Record<string, any>;
      const { data } = await supabase.from("projects").select("*").in("id", allCollabProjectIds);
      const map: Record<string, any> = {};
      for (const p of data ?? []) map[p.id] = p;
      return map;
    },
    enabled: allCollabProjectIds.length > 0,
  });

  const collabProjects = useMemo(
    () => acceptedCollabRows
      .map(c => ({ ...(collabProjectsById[c.project_id] || {}), collabRole: c.role }))
      .filter(p => p.id),
    [acceptedCollabRows, collabProjectsById]
  );

  const invitations = useMemo(
    () => pendingCollabRows
      .map(c => ({ id: c.id, role: c.role, project: collabProjectsById[c.project_id] }))
      .filter(inv => inv.project),
    [pendingCollabRows, collabProjectsById]
  );

  const projectIds = projects.map(p => p.id);

  const { data: engagement = { likes: {}, comments: {} } } = useQuery({
    queryKey: ["project-engagement", projectIds, allCollabProjectIds],
    queryFn: async () => {
      const allIds = [...new Set([...projectIds, ...allCollabProjectIds])];
      const likes: Record<string, number> = {};
      const comments: Record<string, number> = {};
      if (!allIds.length) return { likes, comments };
      const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
        supabase.from("likes").select("project_id").in("project_id", allIds),
        supabase.from("comments").select("project_id").in("project_id", allIds),
      ]);
      for (const row of likeRows ?? []) likes[row.project_id as string] = (likes[row.project_id as string] ?? 0) + 1;
      for (const row of commentRows ?? []) comments[row.project_id as string] = (comments[row.project_id as string] ?? 0) + 1;
      return { likes, comments };
    },
    enabled: projectIds.length > 0 || allCollabProjectIds.length > 0,
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

  const respondInvite = useMutation({
    mutationFn: async ({ collabId, status }: { collabId: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase.from("project_collaborators").update({ status }).eq("id", collabId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["collab-projects-raw"] });
      toast.success(vars.status === "accepted" ? "Invitation accepted!" : "Invitation declined");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getCategoryIcon = (cat: string) => categories.find(c => c.value === cat)?.icon ?? FolderOpen;

  const applySort = (list: any[]) => {
    const copy = [...list];
    if (sort === "newest") copy.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    else if (sort === "oldest") copy.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    else copy.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return copy;
  };

  const applyFilters = (list: any[]) => {
    const term = search.trim().toLowerCase();
    const filtered = list.filter(p => {
      const matchesTerm = !term
        || p.title?.toLowerCase().includes(term)
        || p.description?.toLowerCase().includes(term)
        || (p.tags ?? []).some((t: string) => t.toLowerCase().includes(term));
      const matchesCategory = filterCategory === "all" || p.category === filterCategory;
      return matchesTerm && matchesCategory;
    });
    return applySort(filtered);
  };

  const filteredProjects = useMemo(() => applyFilters(projects), [projects, search, filterCategory, sort]);
  const filteredCollabs = useMemo(() => applyFilters(collabProjects), [collabProjects, search, filterCategory, sort]);

  const categoryCounts = useMemo(() => {
    const source = activeTab === "collabs" ? collabProjects : projects;
    const counts: Record<string, number> = {};
    for (const p of source) counts[p.category || "other"] = (counts[p.category || "other"] ?? 0) + 1;
    return counts;
  }, [projects, collabProjects, activeTab]);

  const stats = [
    { label: "Projects", value: projects.length, icon: FolderOpen },
    { label: "Shared with me", value: collabProjects.length, icon: Users },
    { label: "Public", value: projects.filter(p => p.is_public).length, icon: Globe },
    { label: "Likes", value: Object.values(engagement.likes).reduce((a: number, b: number) => a + (b as number), 0), icon: Heart },
  ];

  const gridClass = view === "grid"
    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
    : "flex flex-col gap-3";

  return (
    <div className="p-3 xs:p-4 md:p-8 max-w-6xl mx-auto w-full overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5 md:p-7 mb-6"
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-6">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/60 bg-background/60 backdrop-blur px-2.5 sm:px-3 py-2.5 min-w-0">
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground truncate">
                <stat.icon size={12} className="shrink-0" /> <span className="truncate">{stat.label}</span>
              </div>
              <p className="font-display text-lg sm:text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Folder-style category grouping */}
      <div className="mb-5">
        <CategoryFolders
          categories={categories}
          active={filterCategory}
          onSelect={setFilterCategory}
          counts={categoryCounts}
          total={(activeTab === "collabs" ? collabProjects : projects).length}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects, tags..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2.5 sm:gap-3">
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-10 flex-1 sm:w-40"><ArrowUpDown size={13} className="mr-1 shrink-0" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="title">Title A–Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 rounded-lg border border-border p-1 shrink-0">
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("grid")}>
              <LayoutGrid size={15} />
            </Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("list")}>
              <List size={15} />
            </Button>
          </div>
        </div>
      </div>

      {/* Create / Edit dialog */}
      <ProjectFormDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}
        editing={!!editingProject}
        categories={categories}
        title={title} setTitle={setTitle}
        description={description} setDescription={setDescription}
        category={category} setCategory={setCategory}
        tags={tags} setTags={setTags}
        isPublic={isPublic} setIsPublic={setIsPublic}
        isProtected={isProtected} setIsProtected={setIsProtected}
        password={password} setPassword={setPassword}
        coverFile={coverFile} setCoverFile={setCoverFile}
        onSave={() => saveMutation.mutate()}
        saving={saveMutation.isPending}
      />

      {/* Collaborators Dialog */}
      <CollaboratorsDialog
        open={!!collabOpen}
        onOpenChange={(v) => { if (!v) { setCollabOpen(null); setInviteSearch(""); } }}
        collabRoles={collabRoles}
        inviteSearch={inviteSearch} setInviteSearch={setInviteSearch}
        inviteRole={inviteRole} setInviteRole={setInviteRole}
        inviteResults={inviteResults}
        collaborators={collaborators as any}
        onInvite={(userId) => collabOpen && inviteMutation.mutate({ projectId: collabOpen, userId })}
        onRemove={(id) => removeCollaborator.mutate(id)}
      />

      {isLoading ? (
        <LoadingCardGrid count={6} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-5 flex-wrap h-auto">
            <TabsTrigger value="mine">My Projects ({filteredProjects.length})</TabsTrigger>
            <TabsTrigger value="collabs">Shared with me ({filteredCollabs.length})</TabsTrigger>
            <TabsTrigger value="invites" className="gap-1"><Mail size={12} /> Invitations {invitations.length > 0 && `(${invitations.length})`}</TabsTrigger>
          </TabsList>

          <TabsContent value="mine">
            {filteredProjects.length > 0 ? (
              <div className={gridClass}>
                {filteredProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project as ProjectCardData}
                    view={view}
                    getCategoryIcon={getCategoryIcon}
                    likeCount={engagement.likes[project.id] ?? 0}
                    commentCount={engagement.comments[project.id] ?? 0}
                    onEdit={openEdit}
                    onManageCollaborators={setCollabOpen}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
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
                {filteredCollabs.map((project: any) => (
                  <ProjectCard
                    key={project.id}
                    project={project as ProjectCardData}
                    view={view}
                    getCategoryIcon={getCategoryIcon}
                    likeCount={engagement.likes[project.id] ?? 0}
                    commentCount={engagement.comments[project.id] ?? 0}
                    isCollab
                    collabRole={project.collabRole}
                  />
                ))}
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

          <TabsContent value="invites">
            <InvitationsPanel
              invitations={invitations as any}
              onAccept={(id) => respondInvite.mutate({ collabId: id, status: "accepted" })}
              onDecline={(id) => respondInvite.mutate({ collabId: id, status: "rejected" })}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
