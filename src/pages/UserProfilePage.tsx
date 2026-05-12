import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  User, MapPin, UserPlus, UserCheck, MessageCircle,
  FolderOpen, ArrowLeft, Music, Image, Video, ExternalLink, FileText, Plus, Trash2, X
} from "lucide-react";
import { ReportDialog } from "@/components/ReportDialog";

const categoryIcons: Record<string, any> = { music: Music, visual: Image, video: Video, other: FolderOpen };
const sb = supabase as any;
type TextTheme = "sunset" | "ocean" | "ink" | "fresh" | "paper" | "royal";
type TextAlign = "left" | "center" | "right";
type TextSize = "sm" | "md" | "lg";

const textThemes: Record<TextTheme, string> = {
  sunset: "bg-gradient-to-br from-primary via-rose-500 to-accent text-primary-foreground",
  ocean: "bg-gradient-to-br from-accent via-cyan-600 to-primary text-white",
  ink: "bg-foreground text-background",
  fresh: "bg-gradient-to-br from-emerald-500 via-accent to-primary text-white",
  paper: "bg-secondary text-secondary-foreground",
  royal: "bg-gradient-to-br from-violet-600 via-primary to-fuchsia-600 text-white",
};

const textAlignClasses: Record<TextAlign, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
};

const textSizeClasses: Record<TextSize, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

const getPostStyle = (tags: string[] = []) => {
  const read = (prefix: string) => tags.find((tag) => tag.startsWith(prefix))?.replace(prefix, "");
  const theme = (read("_style:") || "sunset") as TextTheme;
  const align = (read("_align:") || "center") as TextAlign;
  const size = (read("_size:") || "md") as TextSize;
  return {
    theme: textThemes[theme] ? theme : "sunset",
    align: textAlignClasses[align] ? align : "center",
    size: textSizeClasses[size] ? size : "md",
  };
};

const publicTags = (tags: string[] = []) => tags.filter((tag) => !tag.startsWith("_"));

const splitPostCaption = (caption: string | null) => {
  const text = caption?.trim() || "";
  if (!text) return { title: "Untitled post", body: "" };
  const [first, ...rest] = text.split(/\n\s*\n/);
  return {
    title: first.slice(0, 90),
    body: rest.length > 0 ? rest.join("\n\n") : text,
  };
};

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [commentText, setCommentText] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId!).single();
      return data;
    },
    enabled: !!userId,
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["follower-count", userId],
    queryFn: async () => {
      const { count } = await supabase.from("connections").select("*", { count: "exact", head: true }).eq("following_id", userId!);
      return count ?? 0;
    },
    enabled: !!userId,
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ["following-count", userId],
    queryFn: async () => {
      const { count } = await supabase.from("connections").select("*", { count: "exact", head: true }).eq("follower_id", userId!);
      return count ?? 0;
    },
    enabled: !!userId,
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ["is-following", userId],
    queryFn: async () => {
      const { data } = await supabase.from("connections").select("id").eq("follower_id", user!.id).eq("following_id", userId!).single();
      return !!data;
    },
    enabled: !!user && !!userId && user.id !== userId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["user-projects", userId],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("user_id", userId!).eq("is_public", true).order("created_at", { ascending: false }).limit(12);
      return data ?? [];
    },
    enabled: !!userId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["user-posts", userId],
    queryFn: async () => {
      const { data: rawPosts } = await sb
        .from("posts")
        .select("*")
        .eq("user_id", userId!)
        .eq("is_draft", false)
        .order("created_at", { ascending: false })
        .limit(12);

      const visiblePosts = (rawPosts ?? []).filter((post: any) => post.visibility === "public" || post.user_id === user?.id);
      if (visiblePosts.length === 0) return [];

      const { data: media } = await sb
        .from("post_media")
        .select("*")
        .in("post_id", visiblePosts.map((post: any) => post.id))
        .order("display_order", { ascending: true });

      const mediaMap = new Map<string, any[]>();
      (media ?? []).forEach((item: any) => {
        const current = mediaMap.get(item.post_id) || [];
        current.push(item);
        mediaMap.set(item.post_id, current);
      });

      return visiblePosts.map((post: any) => ({
        ...post,
        parsed: splitPostCaption(post.caption),
        textStyle: getPostStyle(post.tags || []),
        publicTags: publicTags(post.tags || []),
        media: mediaMap.get(post.id) || [],
      }));
    },
    enabled: !!userId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await supabase.from("connections").delete().eq("follower_id", user!.id).eq("following_id", userId!);
      } else {
        await supabase.from("connections").insert({ follower_id: user!.id, following_id: userId! });
        await supabase.from("notifications").insert({
          user_id: userId!, title: "New Follower", message: `${profile?.display_name || "Someone"} started following you`,
          type: "follow", reference_id: user!.id, reference_type: "user",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", userId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", userId] });
      toast.success(isFollowing ? "Unfollowed" : "Following!");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await sb.from("posts").delete().eq("id", postId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedPost(null);
      queryClient.invalidateQueries({ queryKey: ["user-posts", userId] });
      queryClient.invalidateQueries({ queryKey: ["dynamic-feed"] });
      toast.success("Post deleted");
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete post"),
  });

  const { data: postComments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["profile-post-comments", selectedPost?.id],
    queryFn: async () => {
      const { data: comments } = await sb
        .from("post_comments")
        .select("*")
        .eq("post_id", selectedPost.id)
        .order("created_at", { ascending: true })
        .limit(80);

      const userIds = [...new Set((comments ?? []).map((comment: any) => comment.user_id))];
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds)
        : { data: [] as any[] };
      const profileMap = new Map((profiles ?? []).map((item: any) => [item.user_id, item]));

      return (comments ?? []).map((comment: any) => ({
        ...comment,
        profile: profileMap.get(comment.user_id),
      }));
    },
    enabled: !!selectedPost?.id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Please sign in first.");
      if (!selectedPost?.id) throw new Error("No post selected.");
      if (!commentText.trim()) throw new Error("Write a comment first.");
      const { error } = await sb.from("post_comments").insert({
        post_id: selectedPost.id,
        user_id: user.id,
        content: commentText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["profile-post-comments", selectedPost?.id] });
      toast.success("Comment added");
    },
    onError: (error: any) => toast.error(error.message || "Failed to comment"),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await sb.from("post_comments").delete().eq("id", commentId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-post-comments", selectedPost?.id] });
      toast.success("Comment deleted");
    },
    onError: (error: any) => toast.error(error.message || "Failed to delete comment"),
  });

  const isOwnProfile = user?.id === userId;
  const lastSeen = (profile as any)?.last_seen_at ? new Date((profile as any).last_seen_at) : null;
  const isActiveNow = !!lastSeen && Date.now() - lastSeen.getTime() <= 2 * 60 * 1000;
  const lastActiveLabel = lastSeen ? `Last active ${formatDistanceToNow(lastSeen, { addSuffix: true })}` : null;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="flex items-center gap-4"><div className="w-20 h-20 rounded-full bg-muted" /><div className="space-y-2 flex-1"><div className="h-5 bg-muted rounded w-1/3" /><div className="h-4 bg-muted rounded w-1/4" /></div></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto text-center py-20">
        <User size={48} className="text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold">User not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}><ArrowLeft size={14} className="mr-2" /> Go back</Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft size={14} className="mr-1" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <Card className="border-border/50 overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/5" />
          <CardContent className="p-5 -mt-12">
            <div className="flex items-end gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-4 ring-background shrink-0">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={32} className="text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="font-display text-xl font-extrabold text-foreground truncate">{profile.display_name || "Artist"}</h1>
                {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                <div className="mt-1">
                  {isActiveNow ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Active now
                    </span>
                  ) : lastActiveLabel ? (
                    <span className="rounded-full bg-secondary/70 px-2 py-1 text-xs text-muted-foreground">{lastActiveLabel}</span>
                  ) : null}
                </div>
              </div>
            </div>

            {profile.bio && <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {profile.location && <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink size={14} /> Website
                </a>
              )}
              <span className="font-medium text-foreground">{followerCount} followers</span>
              <span className="font-medium text-foreground">{followingCount} following</span>
            </div>

            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(profile.skills as string[]).map(s => (
                  <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
                ))}
              </div>
            )}

            {profile.genres && profile.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(profile.genres as string[]).map(g => (
                  <span key={g} className="text-[11px] px-2.5 py-1 rounded-full bg-accent/10 text-accent-foreground font-medium">{g}</span>
                ))}
              </div>
            )}

            {!isOwnProfile && user && (
              <div className="flex gap-2">
                <Button variant={isFollowing ? "outline" : "hero"} size="sm" onClick={() => followMutation.mutate()}>
                  {isFollowing ? <><UserCheck size={14} className="mr-1" /> Following</> : <><UserPlus size={14} className="mr-1" /> Follow</>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/messages?chatWith=${userId}`)}>
                  <MessageCircle size={14} className="mr-1" /> Message
                </Button>
                <Button variant="outline" size="sm" className="border-border bg-background hover:bg-secondary" onClick={() => setReportOpen(true)}>
                  Report
                </Button>
              </div>
            )}
            {isOwnProfile && (
              <Button variant="hero-outline" size="sm" onClick={() => navigate("/settings")}>Edit Profile</Button>
            )}
          </CardContent>
        </Card>

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold">Posts<span className="text-primary">.</span></h2>
              <p className="text-xs text-muted-foreground">Recent updates, drops, and notes from this creator.</p>
            </div>
            {isOwnProfile && (
              <Button variant="outline" size="sm" onClick={() => navigate("/posts")}>
                <Plus size={14} className="mr-1" /> New post
              </Button>
            )}
          </div>
          {posts.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {posts.map((post: any, i: number) => {
                const firstMedia = post.media?.[0];
                return (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedPost(post)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedPost(post);
                        }
                      }}
                      className="h-full cursor-pointer overflow-hidden border-border/50 bg-card transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                    >
                      {firstMedia ? (
                        <div className="aspect-video bg-muted">
                          {firstMedia.media_type === "video" ? (
                            <video src={firstMedia.media_url} className="h-full w-full object-cover" muted playsInline />
                          ) : (
                            <img src={firstMedia.media_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                      ) : (
                        <div className={`flex aspect-video justify-center p-5 ${textThemes[post.textStyle.theme]} ${textAlignClasses[post.textStyle.align]}`}>
                          <div className="max-w-[92%]">
                            <p className={`font-display font-extrabold leading-tight ${textSizeClasses[post.textStyle.size]}`}>
                              {post.parsed.title}
                            </p>
                            {post.parsed.body && <p className="mt-2 line-clamp-3 text-xs opacity-90">{post.parsed.body}</p>}
                          </div>
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            {post.post_type || "post"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                            {isOwnProfile && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deletePostMutation.mutate(post.id);
                                }}
                              >
                                <Trash2 size={13} />
                              </Button>
                            )}
                          </div>
                        </div>
                        <h3 className="font-display text-sm font-bold leading-tight line-clamp-2">{post.parsed.title}</h3>
                        {post.parsed.body && (
                          <p className="mt-2 text-xs leading-5 text-muted-foreground line-clamp-3">{post.parsed.body}</p>
                        )}
                        {post.publicTags?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {post.publicTags.slice(0, 4).map((tag: string) => (
                              <span key={tag} className="rounded-full bg-secondary px-2 py-1 text-[10px] text-secondary-foreground">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed border-border/60 bg-card">
              <CardContent className="flex flex-col items-center py-10 text-center">
                <FileText size={28} className="mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{isOwnProfile ? "You have not published any posts yet." : "No public posts yet."}</p>
                {isOwnProfile && (
                  <Button className="mt-4" size="sm" onClick={() => navigate("/posts")}>
                    Create your first post
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <h2 className="font-display text-lg font-bold mb-4">Projects<span className="text-primary">.</span></h2>
        {projects.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {projects.map((p, i) => {
              const CatIcon = categoryIcons[p.category || "other"] || FolderOpen;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/projects/${p.id}`}>
                    <Card className="border-border/50 hover:border-primary/20 transition-all overflow-hidden">
                      <div className="h-24 bg-secondary overflow-hidden">
                        {p.cover_url ? <img src={p.cover_url} alt="" className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center"><CatIcon size={24} className="text-muted-foreground/30" /></div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="text-xs font-bold truncate">{p.title}</h3>
                        <p className="text-[10px] text-muted-foreground capitalize">{p.category}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No public projects yet.</p>
        )}
      </motion.div>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        entityType="user"
        entityId={userId || ""}
        reportedUserId={userId}
        entityTitle={profile.display_name || profile.username || "User"}
        entityLabel="user profile"
      />

      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          {selectedPost && (
            <div className="grid max-h-[86vh] overflow-hidden md:grid-cols-[1.15fr_0.85fr]">
              <div className="relative min-h-[320px] bg-black md:min-h-[640px]">
                {selectedPost.media?.length > 0 ? (
                  selectedPost.media[0].media_type === "video" ? (
                    <video
                      src={selectedPost.media[0].media_url}
                      className="h-full max-h-[86vh] w-full object-contain"
                      controls
                      playsInline
                    />
                  ) : (
                  <img
                    src={selectedPost.media[0].media_url}
                    alt=""
                    className="h-full max-h-[86vh] w-full object-cover"
                  />
                  )
                ) : (
                  <div className={`flex h-full justify-center p-8 ${textThemes[selectedPost.textStyle.theme]} ${textAlignClasses[selectedPost.textStyle.align]}`}>
                    <div className="max-w-[92%]">
                      <p className={`font-display font-extrabold leading-tight ${textSizeClasses[selectedPost.textStyle.size]}`}>
                        {selectedPost.parsed.title}
                      </p>
                      {selectedPost.parsed.body && <p className="mt-4 line-clamp-5 text-sm opacity-90">{selectedPost.parsed.body}</p>}
                    </div>
                  </div>
                )}
                <div className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
                  {selectedPost.post_type || "post"}
                </div>
              </div>

              <div className="flex max-h-[86vh] flex-col bg-background">
                <DialogHeader className="border-b border-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 overflow-hidden rounded-full bg-secondary">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User size={18} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <DialogTitle className="font-display text-lg leading-tight">{profile.display_name || "Artist"}</DialogTitle>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedPost.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPost(null)}>
                      <X size={16} />
                    </Button>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-5">
                  <h2 className="font-display text-2xl font-extrabold leading-tight text-foreground">
                    {selectedPost.parsed.title}
                  </h2>
                  {selectedPost.parsed.body && (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {selectedPost.parsed.body}
                    </p>
                  )}
                  {selectedPost.publicTags?.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {selectedPost.publicTags.map((tag: string) => (
                        <span key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 border-t border-border pt-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-base font-bold">Comments</h3>
                      <span className="text-xs text-muted-foreground">{postComments.length}</span>
                    </div>

                    {commentsLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map((item) => (
                          <div key={item} className="h-14 animate-pulse rounded-lg bg-muted" />
                        ))}
                      </div>
                    ) : postComments.length > 0 ? (
                      <div className="space-y-3">
                        {postComments.map((comment: any) => (
                          <div key={comment.id} className="group flex gap-3 rounded-lg bg-card p-3">
                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-secondary">
                              {comment.profile?.avatar_url ? (
                                <img src={comment.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <User size={13} className="text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-xs font-semibold text-foreground">
                                  {comment.profile?.display_name || "Creator"}
                                </p>
                                {comment.user_id === user?.id && (
                                  <button
                                    className="text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100"
                                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                        No comments yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 border-t border-border p-5">
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addCommentMutation.mutate();
                    }}
                  >
                    <Input
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder={user ? "Write a comment..." : "Sign in to comment"}
                      disabled={!user || addCommentMutation.isPending}
                    />
                    <Button type="submit" disabled={!user || !commentText.trim() || addCommentMutation.isPending}>
                      Send
                    </Button>
                  </form>

                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deletePostMutation.mutate(selectedPost.id)}
                      disabled={deletePostMutation.isPending}
                    >
                      <Trash2 size={14} />
                      Delete post
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
