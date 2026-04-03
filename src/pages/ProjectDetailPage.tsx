import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, FolderOpen, FolderPlus, Upload, File, Image as ImageIcon, Music,
  Video, Trash2, Download, Users, UserPlus, Send, MessageCircle, Search,
  MoreVertical, Shield, Pen, Eye, Heart, Globe, Lock,
  User, X, Check, XCircle, FileText, Archive, ZoomIn, Maximize2, ChevronLeft, ChevronRight
} from "lucide-react";
import { UserAvatar, UserName } from "@/components/UserLink";
import { ReportDialog } from "@/components/ReportDialog";

const collabRoles = [
  { value: "editor", label: "Editor", icon: Pen },
  { value: "viewer", label: "Viewer", icon: Eye },
  { value: "contributor", label: "Contributor", icon: Shield },
];

const getFileIcon = (type: string | null) => {
  if (!type) return File;
  if (type.startsWith("image")) return ImageIcon;
  if (type.startsWith("audio")) return Music;
  if (type.startsWith("video")) return Video;
  if (type.includes("pdf")) return FileText;
  return File;
};

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("files");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [chatText, setChatText] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string>("/");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: string | null; name: string } | null>(null);
  const [previewIndex, setPreviewIndex] = useState(-1);
  const [reportOpen, setReportOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project-detail", projectId],
    queryFn: async () => { const { data } = await supabase.from("projects").select("*").eq("id", projectId!).single(); return data; },
    enabled: !!projectId,
  });

  const { data: ownerProfile } = useQuery({
    queryKey: ["project-owner", project?.user_id],
    queryFn: async () => { const { data } = await supabase.from("profiles").select("*").eq("user_id", project!.user_id).single(); return data; },
    enabled: !!project,
  });

  const isOwner = project?.user_id === user?.id;
  const { data: myCollab } = useQuery({
    queryKey: ["my-collab-status", projectId],
    queryFn: async () => { const { data } = await supabase.from("project_collaborators").select("*").eq("project_id", projectId!).eq("user_id", user!.id).single(); return data; },
    enabled: !!projectId && !!user && !isOwner,
  });
  const canEdit = isOwner || myCollab?.role === "editor" || myCollab?.role === "contributor";
  const isMember = isOwner || (myCollab?.status === "accepted");

  const { data: collaborators = [] } = useQuery({
    queryKey: ["project-collabs", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("project_collaborators").select("*").eq("project_id", projectId!);
      if (!data?.length) return [];
      const result = [];
      for (const c of data) {
        const { data: prof } = await supabase.from("profiles").select("display_name, avatar_url, username, user_id").eq("user_id", c.user_id).single();
        result.push({ ...c, profile: prof });
      }
      return result;
    },
    enabled: !!projectId,
  });

  const { data: media = [] } = useQuery({
    queryKey: ["project-media", projectId],
    queryFn: async () => { const { data } = await supabase.from("project_media").select("*").eq("project_id", projectId!).order("created_at", { ascending: false }); return data ?? []; },
    enabled: !!projectId,
  });

  // Project-scoped comments (chat)
  const { data: chatMessages = [] } = useQuery({
    queryKey: ["project-chat", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("comments").select("*").eq("project_id", projectId!).order("created_at", { ascending: true }).limit(100);
      const msgs = data ?? [];
      const uids = [...new Set(msgs.map(m => m.user_id))];
      const profiles: Record<string, any> = {};
      for (const uid of uids) { const { data: p } = await supabase.from("profiles").select("display_name, avatar_url, user_id").eq("user_id", uid).single(); profiles[uid] = p; }
      return msgs.map(m => ({ ...m, profile: profiles[m.user_id] }));
    },
    enabled: !!projectId,
  });

  const { data: likeCount = 0 } = useQuery({
    queryKey: ["project-likes", projectId],
    queryFn: async () => { const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("project_id", projectId!); return count ?? 0; },
    enabled: !!projectId,
  });

  const { data: inviteResults = [] } = useQuery({
    queryKey: ["invite-search-detail", inviteSearch],
    queryFn: async () => {
      if (!inviteSearch.trim()) return [];
      const { data } = await supabase.from("profiles").select("*").neq("user_id", user!.id).or(`display_name.ilike.%${inviteSearch}%,username.ilike.%${inviteSearch}%`).limit(5);
      return data ?? [];
    },
    enabled: inviteSearch.length > 1,
  });

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase.channel(`project-chat-${projectId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `project_id=eq.${projectId}` },
        () => queryClient.invalidateQueries({ queryKey: ["project-chat", projectId] })
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, queryClient]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      const folder = currentFolder === "/" ? "" : currentFolder;
      const path = `${projectId}${folder}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("project-files").upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
      const { error } = await supabase.from("project_media").insert({ project_id: projectId!, user_id: user!.id, file_url: urlData.publicUrl, file_name: `${folder ? folder + "/" : ""}${file.name}`, file_type: file.type });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project-media", projectId] }); toast.success("File uploaded!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteFile = useMutation({
    mutationFn: async (mediaId: string) => { const { error } = await supabase.from("project_media").delete().eq("id", mediaId); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project-media", projectId] }); toast.success("File deleted"); },
  });

  const sendChat = useMutation({
    mutationFn: async () => {
      if (!chatText.trim()) return;
      const { error } = await supabase.from("comments").insert({ project_id: projectId!, user_id: user!.id, content: chatText.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setChatText(""); queryClient.invalidateQueries({ queryKey: ["project-chat", projectId] }); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project-chat", projectId] }); toast.success("Deleted"); },
  });

  const inviteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("project_collaborators").insert({ project_id: projectId!, user_id: userId, invited_by: user!.id, role: inviteRole, status: "pending" });
      if (error) throw error;
      await supabase.from("notifications").insert({ user_id: userId, title: "Project Invitation", message: `You've been invited to collaborate on "${project?.title}"`, type: "collaboration", reference_id: projectId!, reference_type: "project" });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project-collabs", projectId] }); setInviteSearch(""); toast.success("Invitation sent!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateCollabStatus = useMutation({
    mutationFn: async ({ collabId, status }: { collabId: string; status: string }) => {
      const { error } = await supabase.from("project_collaborators").update({ status }).eq("id", collabId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project-collabs", projectId] }); queryClient.invalidateQueries({ queryKey: ["my-collab-status", projectId] }); toast.success("Status updated"); },
  });

  const removeCollaborator = useMutation({
    mutationFn: async (collabId: string) => { const { error } = await supabase.from("project_collaborators").delete().eq("id", collabId); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project-collabs", projectId] }); toast.success("Collaborator removed"); },
  });

  const folders = [...new Set(media.map(m => m.file_name?.split("/").slice(0, -1).join("/")).filter(Boolean))] as string[];
  const currentFiles = media.filter(m => {
    if (currentFolder === "/") return !m.file_name?.includes("/") || m.file_name?.split("/").length === 1;
    return m.file_name?.startsWith(currentFolder + "/");
  });

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    setCurrentFolder(currentFolder === "/" ? newFolderName.trim() : `${currentFolder}/${newFolderName.trim()}`);
    setNewFolderName("");
    setShowNewFolder(false);
    toast.success("Folder created! Upload files to populate it.");
  };

  const openFilePreview = (file: typeof media[0], index: number) => {
    setPreviewFile({ url: file.file_url, type: file.file_type, name: file.file_name?.split("/").pop() || "File" });
    setPreviewIndex(index);
  };

  const navigatePreview = (dir: -1 | 1) => {
    const newIdx = previewIndex + dir;
    if (newIdx >= 0 && newIdx < currentFiles.length) {
      const f = currentFiles[newIdx];
      setPreviewFile({ url: f.file_url, type: f.file_type, name: f.file_name?.split("/").pop() || "File" });
      setPreviewIndex(newIdx);
    }
  };

  if (isLoading) {
    return <div className="p-6 md:p-8 max-w-5xl"><div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-1/3" /><div className="h-48 bg-muted rounded-xl" /></div></div>;
  }

  if (!project) {
    return <div className="p-6 md:p-8 max-w-5xl text-center py-20"><h2 className="font-display text-xl font-bold mb-2">Project not found</h2><Button variant="outline" onClick={() => navigate("/projects")}>Back to Projects</Button></div>;
  }

  const pendingInvite = !isOwner && myCollab?.status === "pending";

  return (
    <div className="p-4 md:p-6 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4 mb-6">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 mt-1" onClick={() => navigate("/projects")}><ArrowLeft size={18} /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-xl md:text-2xl font-extrabold text-foreground truncate">{project.title}</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground flex items-center gap-1">
              {project.is_public ? <Globe size={10} /> : <Lock size={10} />} {project.is_public ? "Public" : "Private"}
            </span>
            {project.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{project.category}</span>}
          </div>
          {project.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <Link to={`/profile/${project.user_id}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <UserAvatar userId={project.user_id} avatarUrl={ownerProfile?.avatar_url} size={5} />
              <span>{ownerProfile?.display_name || "Artist"}</span>
            </Link>
            <span className="flex items-center gap-1"><Heart size={12} /> {likeCount}</span>
            <span className="flex items-center gap-1"><Users size={12} /> {collaborators.filter(c => c.status === "accepted").length + 1} members</span>
          </div>
        </div>
        {isOwner && (
          <Button variant="hero" size="sm" onClick={() => setInviteOpen(true)} className="shrink-0"><UserPlus size={14} /> Invite</Button>
        )}
        <Button variant="outline" size="sm" className="shrink-0 border-border bg-background hover:bg-secondary" onClick={() => setReportOpen(true)}>
          Report
        </Button>
      </motion.div>

      {pendingInvite && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/30 bg-primary/5 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <UserPlus size={18} className="text-primary shrink-0" />
              <p className="text-sm flex-1">You've been invited as <strong className="capitalize">{myCollab?.role}</strong>.</p>
              <Button variant="hero" size="sm" onClick={() => updateCollabStatus.mutate({ collabId: myCollab!.id, status: "accepted" })}><Check size={14} /> Accept</Button>
              <Button variant="outline" size="sm" onClick={() => updateCollabStatus.mutate({ collabId: myCollab!.id, status: "rejected" })}><XCircle size={14} /> Decline</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {project.cover_url && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl overflow-hidden mb-6 h-48 bg-secondary">
          <img src={project.cover_url} alt="" className="w-full h-full object-cover" />
        </motion.div>
      )}

      {project.tags && (project.tags as string[]).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {(project.tags as string[]).map(t => <span key={t} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">#{t}</span>)}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 mb-6">
          <TabsTrigger value="files" className="gap-1.5"><FolderOpen size={14} /> Files</TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5"><MessageCircle size={14} /> Chat</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><Users size={14} /> Team</TabsTrigger>
        </TabsList>

        {/* FILES TAB */}
        <TabsContent value="files">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 text-sm">
                <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setCurrentFolder("/")}>Root</button>
                {currentFolder !== "/" && currentFolder.split("/").map((part, i, arr) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="text-muted-foreground">/</span>
                    <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setCurrentFolder(arr.slice(0, i + 1).join("/"))}>{part}</button>
                  </span>
                ))}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowNewFolder(true)}><FolderPlus size={14} /> New Folder</Button>
                  <label>
                    <Button variant="hero" size="sm" asChild><span><Upload size={14} /> Upload</span></Button>
                    <input type="file" className="hidden" multiple onChange={e => { const files = e.target.files; if (files) Array.from(files).forEach(f => uploadFile.mutate(f)); }} />
                  </label>
                </div>
              )}
            </div>

            <AnimatePresence>
              {showNewFolder && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4">
                  <div className="flex gap-2">
                    <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name..." className="h-9" autoFocus />
                    <Button size="sm" onClick={createFolder} disabled={!newFolderName.trim()}>Create</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowNewFolder(false)}>Cancel</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {currentFolder === "/" && folders.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {folders.map(f => (
                  <button key={f} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left" onClick={() => setCurrentFolder(f)}>
                    <FolderOpen size={18} className="text-primary shrink-0" />
                    <span className="text-sm font-medium truncate">{f}</span>
                  </button>
                ))}
              </div>
            )}

            {currentFiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentFiles.map((file, idx) => {
                  const FileIcon = getFileIcon(file.file_type);
                  const isImage = file.file_type?.startsWith("image");
                  const isAudio = file.file_type?.startsWith("audio");
                  const isVideo = file.file_type?.startsWith("video");
                  return (
                    <motion.div key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                      <Card className="border-border/50 hover:border-primary/20 transition-all overflow-hidden group">
                        <CardContent className="p-0">
                          {isImage ? (
                            <div className="h-32 bg-secondary cursor-pointer relative" onClick={() => openFilePreview(file, idx)}>
                              <img src={file.file_url} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-32 bg-secondary/50 flex items-center justify-center cursor-pointer" onClick={() => openFilePreview(file, idx)}>
                              <FileIcon size={32} className="text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="p-3 flex items-center gap-2">
                            <FileIcon size={14} className="text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium truncate flex-1">{file.file_name?.split("/").pop() || "File"}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1 hover:text-primary" onClick={() => openFilePreview(file, idx)}><Maximize2 size={12} /></button>
                              <a href={file.file_url} download className="p-1 hover:text-primary"><Download size={12} /></a>
                              {(isOwner || file.user_id === user?.id) && (
                                <button className="p-1 hover:text-destructive" onClick={() => deleteFile.mutate(file.id)}><Trash2 size={12} /></button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="border-border/50 border-dashed">
                <CardContent className="py-12 flex flex-col items-center text-center">
                  <Archive size={32} className="text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No files in this folder yet</p>
                  {canEdit && <p className="text-xs text-muted-foreground mt-1">Upload files to get started</p>}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* CHAT TAB */}
        <TabsContent value="chat">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-22rem)]">
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle size={32} className="text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMe = msg.user_id === user?.id;
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                      className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"} group/chatmsg`}>
                      {!isMe && <UserAvatar userId={msg.user_id} avatarUrl={msg.profile?.avatar_url} size={7} />}
                      <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm relative ${isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-secondary-foreground rounded-bl-md"}`}>
                        {!isMe && <p className="text-[10px] font-semibold mb-0.5 opacity-70">{msg.profile?.display_name || "Artist"}</p>}
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-0.5 ${isMe ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {isMe && (
                          <button className="absolute -left-6 top-1 opacity-0 group-hover/chatmsg:opacity-100 transition-opacity p-1 hover:text-destructive"
                            onClick={() => deleteComment.mutate(msg.id)}>
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
            {(isMember || isOwner) && (
              <form className="flex gap-2" onSubmit={e => { e.preventDefault(); sendChat.mutate(); }}>
                <Input value={chatText} onChange={e => setChatText(e.target.value)} placeholder="Type a message..." className="flex-1 h-10" />
                <Button variant="hero" size="icon" className="h-10 w-10 shrink-0" type="submit" disabled={!chatText.trim()}><Send size={16} /></Button>
              </form>
            )}
          </motion.div>
        </TabsContent>

        {/* TEAM TAB */}
        <TabsContent value="team">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <UserAvatar userId={project.user_id} avatarUrl={ownerProfile?.avatar_url} size={10} />
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${project.user_id}`} className="text-sm font-semibold hover:text-primary transition-colors">{ownerProfile?.display_name || "Artist"}</Link>
                {ownerProfile?.username && <p className="text-[11px] text-muted-foreground">@{ownerProfile.username}</p>}
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Owner</span>
            </div>

            {collaborators.length > 0 ? (
              <div className="space-y-2">
                {collaborators.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <UserAvatar userId={c.user_id} avatarUrl={c.profile?.avatar_url} size={9} />
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${c.user_id}`} className="text-sm font-medium hover:text-primary transition-colors">{c.profile?.display_name || "Artist"}</Link>
                      <p className="text-[10px] text-muted-foreground capitalize">{c.role} · {c.status}</p>
                    </div>
                    {isOwner && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeCollaborator.mutate(c.id)}><X size={14} /></Button>}
                    {c.user_id === user?.id && c.status === "pending" && (
                      <div className="flex gap-1">
                        <Button variant="hero" size="sm" className="h-7 text-xs" onClick={() => updateCollabStatus.mutate({ collabId: c.id, status: "accepted" })}>Accept</Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => updateCollabStatus.mutate({ collabId: c.id, status: "rejected" })}>Decline</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-border/50 border-dashed">
                <CardContent className="py-8 text-center">
                  <Users size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No collaborators yet</p>
                  {isOwner && <Button variant="hero" size="sm" className="mt-3" onClick={() => setInviteOpen(true)}><UserPlus size={14} /> Invite People</Button>}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* In-app File Preview */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-background">
          {previewFile && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="text-sm font-medium truncate">{previewFile.name}</h3>
                <div className="flex gap-2">
                  <a href={previewFile.url} download><Button variant="outline" size="sm"><Download size={14} /> Download</Button></a>
                </div>
              </div>
              <div className="flex-1 relative flex items-center justify-center bg-secondary/30 min-h-[50vh] overflow-auto p-4">
                {/* Nav arrows */}
                {previewIndex > 0 && (
                  <button className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md z-10" onClick={() => navigatePreview(-1)}>
                    <ChevronLeft size={20} />
                  </button>
                )}
                {previewIndex < currentFiles.length - 1 && (
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-md z-10" onClick={() => navigatePreview(1)}>
                    <ChevronRight size={20} />
                  </button>
                )}

                {previewFile.type?.startsWith("image") ? (
                  <img src={previewFile.url} alt="" className="max-w-full max-h-[70vh] object-contain rounded" />
                ) : previewFile.type?.startsWith("video") ? (
                  <video src={previewFile.url} controls className="max-w-full max-h-[70vh] rounded" />
                ) : previewFile.type?.startsWith("audio") ? (
                  <div className="flex flex-col items-center gap-4 p-8">
                    <Music size={48} className="text-primary" />
                    <p className="text-sm font-medium">{previewFile.name}</p>
                    <audio src={previewFile.url} controls className="w-full max-w-md" />
                  </div>
                ) : previewFile.type?.includes("pdf") ? (
                  <iframe src={previewFile.url} className="w-full h-[70vh] rounded border-0" title={previewFile.name} />
                ) : (
                  <div className="flex flex-col items-center gap-4 p-8">
                    <File size={48} className="text-muted-foreground" />
                    <p className="text-sm">Preview not available for this file type</p>
                    <a href={previewFile.url} download><Button variant="hero" size="sm"><Download size={14} /> Download to view</Button></a>
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-border text-center text-[10px] text-muted-foreground">
                {previewIndex + 1} of {currentFiles.length} files
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><UserPlus size={18} /> Invite to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search artists..." className="pl-9 h-9" value={inviteSearch} onChange={e => setInviteSearch(e.target.value)} autoFocus />
              </div>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{collabRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {inviteResults.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {inviteResults.map(p => {
                  const alreadyInvited = collaborators.some((c: any) => c.user_id === p.user_id);
                  return (
                    <button key={p.id} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 text-left text-sm disabled:opacity-50"
                      onClick={() => inviteMutation.mutate(p.user_id)} disabled={alreadyInvited}>
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={12} className="text-muted-foreground" />}
                      </div>
                      <span className="flex-1">{p.display_name || "Artist"}</span>
                      {alreadyInvited ? <span className="text-[10px] text-muted-foreground">Invited</span> : <UserPlus size={14} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        entityType="project"
        entityId={projectId || ""}
        reportedUserId={project.user_id}
        entityTitle={project.title}
        entityLabel="project"
      />
    </div>
  );
}
