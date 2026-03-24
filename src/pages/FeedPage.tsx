import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Heart, MessageCircle, Bookmark, BookmarkCheck, Send, Globe,
  Flame, Share2, MoreHorizontal, Trash2, Sparkles, TrendingUp, Zap, Eye
} from "lucide-react";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { UserAvatar, UserName } from "@/components/UserLink";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const MARQUEE_WORDS = [
  "Create", "Collaborate", "Inspire", "Produce", "Mix", "Design", "Share", "Connect",
  "Record", "Perform", "Compose", "Innovate", "Express", "Build"
];

const SUGGESTIONS = [
  { icon: Sparkles, text: "Discover trending projects", color: "text-yellow-500" },
  { icon: TrendingUp, text: "Follow top creators", color: "text-green-500" },
  { icon: Zap, text: "Start a new collaboration", color: "text-primary" },
];

export default function FeedPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"latest" | "trending">("latest");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["feed-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("is_public", true).order("created_at", { ascending: false }).limit(30);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: creators = {} } = useQuery({
    queryKey: ["feed-creators", projects.map(p => p.user_id)],
    queryFn: async () => {
      const userIds = [...new Set(projects.map(p => p.user_id))];
      const result: Record<string, any> = {};
      for (const uid of userIds) {
        const { data } = await supabase.from("profiles").select("display_name, avatar_url, username, user_id").eq("user_id", uid).single();
        result[uid] = data;
      }
      return result;
    },
    enabled: projects.length > 0,
  });

  const { data: myLikes = [] } = useQuery({
    queryKey: ["my-likes"],
    queryFn: async () => { const { data } = await supabase.from("likes").select("project_id").eq("user_id", user!.id); return (data ?? []).map(l => l.project_id); },
    enabled: !!user,
  });

  const { data: likeCounts = {} } = useQuery({
    queryKey: ["feed-like-counts", projects.map(p => p.id)],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const p of projects) { const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("project_id", p.id); counts[p.id] = count ?? 0; }
      return counts;
    },
    enabled: projects.length > 0,
  });

  const { data: myBookmarks = [] } = useQuery({
    queryKey: ["my-bookmarks"],
    queryFn: async () => { const { data } = await supabase.from("bookmarks").select("project_id").eq("user_id", user!.id); return (data ?? []).map(b => b.project_id); },
    enabled: !!user,
  });

  const { data: commentCounts = {} } = useQuery({
    queryKey: ["feed-comment-counts", projects.map(p => p.id)],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const p of projects) { const { count } = await supabase.from("comments").select("*", { count: "exact", head: true }).eq("project_id", p.id); counts[p.id] = count ?? 0; }
      return counts;
    },
    enabled: projects.length > 0,
  });

  // Feed-specific comments (scoped per project)
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const { data: commentsData = [] } = useQuery({
    queryKey: ["feed-comments-for", expandedComments],
    queryFn: async () => {
      const { data } = await supabase.from("comments").select("*").eq("project_id", expandedComments!).order("created_at", { ascending: true }).limit(20);
      const comments = data ?? [];
      const authorIds = [...new Set(comments.map(c => c.user_id))];
      const profiles: Record<string, any> = {};
      for (const uid of authorIds) { const { data: prof } = await supabase.from("profiles").select("display_name, avatar_url, user_id").eq("user_id", uid).single(); profiles[uid] = prof; }
      return comments.map(c => ({ ...c, profile: profiles[c.user_id] }));
    },
    enabled: !!expandedComments,
  });

  const likeMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (myLikes.includes(projectId)) { await supabase.from("likes").delete().eq("user_id", user!.id).eq("project_id", projectId); }
      else { await supabase.from("likes").insert({ user_id: user!.id, project_id: projectId }); }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["my-likes"] }); queryClient.invalidateQueries({ queryKey: ["feed-like-counts"] }); },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (myBookmarks.includes(projectId)) { await supabase.from("bookmarks").delete().eq("user_id", user!.id).eq("project_id", projectId); }
      else { await supabase.from("bookmarks").insert({ user_id: user!.id, project_id: projectId }); }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["my-bookmarks"] }); toast.success("Updated bookmarks"); },
  });

  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const commentMutation = useMutation({
    mutationFn: async ({ projectId, content }: { projectId: string; content: string }) => {
      const { error } = await supabase.from("comments").insert({ user_id: user!.id, project_id: projectId, content });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      setCommentText("");
      setCommentingOn(null);
      queryClient.invalidateQueries({ queryKey: ["feed-comment-counts"] });
      queryClient.invalidateQueries({ queryKey: ["feed-comments-for", vars.projectId] });
      toast.success("Comment added!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ commentId, projectId }: { commentId: string; projectId: string }) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user!.id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["feed-comments-for", projectId] });
      queryClient.invalidateQueries({ queryKey: ["feed-comment-counts"] });
      toast.success("Comment deleted");
    },
  });

  const handleShare = (project: any) => {
    navigator.clipboard.writeText(`${window.location.origin}/projects/${project.id}`);
    toast.success("Link copied!");
  };

  const trendingProjects = [...projects].sort((a, b) => {
    const aScore = (likeCounts[a.id] ?? 0) + (commentCounts[a.id] ?? 0) * 2;
    const bScore = (likeCounts[b.id] ?? 0) + (commentCounts[b.id] ?? 0) * 2;
    return bScore - aScore;
  });

  const displayProjects = activeTab === "trending" ? trendingProjects : projects;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Animated Marquee Banner */}
      <div className="overflow-hidden py-3 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b border-border/30">
        <motion.div
          className="flex gap-6 whitespace-nowrap"
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
            <span key={i} className="text-sm font-display font-bold text-primary/40 select-none">
              {word} <span className="text-accent/30">·</span>
            </span>
          ))}
        </motion.div>
      </div>

      <div className="p-6 md:p-8">
        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-6"
        >
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Your
            </motion.span>{" "}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            >
              Creative
            </motion.span>{" "}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Feed<span className="text-primary">.</span>
            </motion.span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mt-2 text-sm"
          >
            Discover what the community is building today.
          </motion.p>
        </motion.div>

        {/* Dynamic Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-1"
        >
          {SUGGESTIONS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/60 border border-border/30 text-xs font-medium whitespace-nowrap cursor-pointer hover:border-primary/30 transition-colors"
            >
              <s.icon size={14} className={s.color} />
              {s.text}
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-1 mb-6 p-1 bg-secondary/50 rounded-lg w-fit"
        >
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "latest" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab("latest")}
          >
            <Globe size={14} className="inline mr-1.5" /> Latest
          </button>
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "trending" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab("trending")}
          >
            <Flame size={14} className="inline mr-1.5" /> Trending
          </button>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-border/50 animate-pulse">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="space-y-1.5 flex-1"><div className="h-4 bg-muted rounded w-1/4" /><div className="h-3 bg-muted rounded w-1/6" /></div>
                  </div>
                  <div className="h-48 bg-muted rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayProjects.length > 0 ? (
          <div className="space-y-5">
            <AnimatePresence>
              {displayProjects.map((project, idx) => {
                const creator = creators[project.user_id];
                const liked = myLikes.includes(project.id);
                const bookmarked = myBookmarks.includes(project.id);
                const lc = likeCounts[project.id] ?? 0;
                const cc = commentCounts[project.id] ?? 0;
                const showComments = expandedComments === project.id;

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, type: "spring", stiffness: 200, damping: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Card className="border-border/50 hover:border-primary/10 transition-all overflow-hidden group hover:shadow-lg hover:shadow-primary/5">
                      <CardContent className="p-0">
                        {/* Author Header */}
                        <div className="flex items-center gap-3 p-4 pb-3">
                          <UserAvatar userId={project.user_id} avatarUrl={creator?.avatar_url} size={10} className="ring-2 ring-border group-hover:ring-primary/30 transition-all" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold">
                              <UserName userId={project.user_id} name={creator?.display_name} />
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {creator?.username ? `@${creator.username} · ` : ""}{timeAgo(project.created_at)}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal size={16} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/projects/${project.id}`} className="flex items-center gap-2">
                                  <Eye size={14} /> View Project
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShare(project)}>
                                <Share2 size={14} className="mr-2" /> Copy Link
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Cover Image */}
                        {project.cover_url && (
                          <Link to={`/projects/${project.id}`}>
                            <motion.div
                              className="bg-secondary mx-4 rounded-xl overflow-hidden cursor-pointer"
                              whileHover={{ scale: 1.01 }}
                              transition={{ duration: 0.2 }}
                            >
                              <img src={project.cover_url} alt="" className="w-full max-h-[400px] object-cover" />
                            </motion.div>
                          </Link>
                        )}

                        {/* Content */}
                        <div className="px-4 pt-3">
                          <Link to={`/projects/${project.id}`}>
                            <h3 className="font-display font-bold text-base mb-1 hover:text-primary transition-colors">{project.title}</h3>
                          </Link>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{project.description}</p>
                          )}
                          {project.tags && (project.tags as string[]).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {(project.tags as string[]).map(t => (
                                <motion.span
                                  key={t}
                                  whileHover={{ scale: 1.1 }}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium cursor-pointer"
                                >
                                  #{t}
                                </motion.span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 px-2 py-2 border-t border-border/30 mx-2">
                          <Button
                            variant="ghost" size="sm"
                            className={`h-9 text-xs gap-1.5 rounded-full ${liked ? "text-destructive" : ""}`}
                            onClick={() => likeMutation.mutate(project.id)}
                          >
                            <motion.div animate={liked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
                              <Heart size={16} fill={liked ? "currentColor" : "none"} />
                            </motion.div>
                            {lc > 0 && lc}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-9 text-xs gap-1.5 rounded-full"
                            onClick={() => { setExpandedComments(showComments ? null : project.id); setCommentingOn(showComments ? null : project.id); }}
                          >
                            <MessageCircle size={16} /> {cc > 0 && cc}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-9 text-xs gap-1.5 rounded-full" onClick={() => handleShare(project)}>
                            <Share2 size={16} />
                          </Button>
                          <div className="flex-1" />
                          <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-full ${bookmarked ? "text-primary" : ""}`}
                            onClick={() => bookmarkMutation.mutate(project.id)}
                          >
                            <motion.div animate={bookmarked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.2 }}>
                              {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                            </motion.div>
                          </Button>
                        </div>

                        {/* Comments Section (scoped to this project) */}
                        <AnimatePresence>
                          {showComments && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-3">
                                {commentsData.length > 0 && (
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {commentsData.map((comment, ci) => (
                                      <motion.div
                                        key={comment.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: ci * 0.03 }}
                                        className="flex gap-2 group/comment"
                                      >
                                        <UserAvatar userId={comment.user_id} avatarUrl={comment.profile?.avatar_url} size={7} />
                                        <div className="flex-1 bg-secondary/50 rounded-xl px-3 py-2">
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium">
                                              <UserName userId={comment.user_id} name={comment.profile?.display_name} />
                                            </p>
                                            {comment.user_id === user!.id && (
                                              <button
                                                className="opacity-0 group-hover/comment:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                                                onClick={() => deleteCommentMutation.mutate({ commentId: comment.id, projectId: project.id })}
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground">{comment.content}</p>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                                <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (commentText.trim()) commentMutation.mutate({ projectId: project.id, content: commentText.trim() }); }}>
                                  <Input
                                    value={commentingOn === project.id ? commentText : ""}
                                    onChange={e => { setCommentText(e.target.value); setCommentingOn(project.id); }}
                                    placeholder="Write a comment..."
                                    className="flex-1 h-9 text-sm rounded-full"
                                    autoFocus
                                  />
                                  <Button variant="hero" size="icon" className="h-9 w-9 shrink-0 rounded-full" type="submit">
                                    <Send size={14} />
                                  </Button>
                                </form>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }}>
            <Card className="border-border/50 border-dashed">
              <CardContent className="py-16 flex flex-col items-center text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
                >
                  <Globe size={28} className="text-primary" />
                </motion.div>
                <h3 className="font-display font-bold text-lg text-foreground mb-1">No posts yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Create a public project and it will appear in the feed.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
