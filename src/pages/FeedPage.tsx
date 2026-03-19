import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Heart, MessageCircle, User, Bookmark, BookmarkCheck, Send, Globe, FolderOpen
} from "lucide-react";
import { useState } from "react";

export default function FeedPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Public projects feed
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["feed-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Get creators
  const { data: creators = {} } = useQuery({
    queryKey: ["feed-creators", projects.map(p => p.user_id)],
    queryFn: async () => {
      const userIds = [...new Set(projects.map(p => p.user_id))];
      const result: Record<string, any> = {};
      for (const uid of userIds) {
        const { data } = await supabase.from("profiles").select("display_name, avatar_url, username").eq("user_id", uid).single();
        result[uid] = data;
      }
      return result;
    },
    enabled: projects.length > 0,
  });

  // Likes
  const { data: myLikes = [] } = useQuery({
    queryKey: ["my-likes"],
    queryFn: async () => {
      const { data } = await supabase.from("likes").select("project_id").eq("user_id", user!.id);
      return (data ?? []).map(l => l.project_id);
    },
    enabled: !!user,
  });

  const { data: likeCounts = {} } = useQuery({
    queryKey: ["feed-like-counts", projects.map(p => p.id)],
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

  // Bookmarks
  const { data: myBookmarks = [] } = useQuery({
    queryKey: ["my-bookmarks"],
    queryFn: async () => {
      const { data } = await supabase.from("bookmarks").select("project_id").eq("user_id", user!.id);
      return (data ?? []).map(b => b.project_id);
    },
    enabled: !!user,
  });

  // Comments
  const { data: commentCounts = {} } = useQuery({
    queryKey: ["feed-comment-counts", projects.map(p => p.id)],
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

  const likeMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (myLikes.includes(projectId)) {
        await supabase.from("likes").delete().eq("user_id", user!.id).eq("project_id", projectId);
      } else {
        await supabase.from("likes").insert({ user_id: user!.id, project_id: projectId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
      queryClient.invalidateQueries({ queryKey: ["feed-like-counts"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (myBookmarks.includes(projectId)) {
        await supabase.from("bookmarks").delete().eq("user_id", user!.id).eq("project_id", projectId);
      } else {
        await supabase.from("bookmarks").insert({ user_id: user!.id, project_id: projectId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookmarks"] });
      toast.success("Updated bookmarks");
    },
  });

  // Comment inline
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const commentMutation = useMutation({
    mutationFn: async ({ projectId, content }: { projectId: string; content: string }) => {
      const { error } = await supabase.from("comments").insert({
        user_id: user!.id,
        project_id: projectId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText("");
      setCommentingOn(null);
      queryClient.invalidateQueries({ queryKey: ["feed-comment-counts"] });
      toast.success("Comment added!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
          Feed<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Latest from the creative community.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-border/50 animate-pulse">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/6" />
                  </div>
                </div>
                <div className="h-40 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map(project => {
            const creator = creators[project.user_id];
            const liked = myLikes.includes(project.id);
            const bookmarked = myBookmarks.includes(project.id);

            return (
              <Card key={project.id} className="border-border/50">
                <CardContent className="p-5">
                  {/* Author */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {creator?.avatar_url ? (
                        <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={16} className="text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{creator?.display_name || "Artist"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {creator?.username ? `@${creator.username}` : ""} · {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Cover */}
                  {project.cover_url && (
                    <div className="rounded-lg overflow-hidden mb-3 bg-secondary">
                      <img src={project.cover_url} alt="" className="w-full h-48 object-cover" />
                    </div>
                  )}

                  {/* Content */}
                  <h3 className="font-display font-bold text-base mb-1">{project.title}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                  )}

                  {project.tags && (project.tags as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(project.tags as string[]).map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 text-xs gap-1 ${liked ? "text-destructive" : ""}`}
                      onClick={() => likeMutation.mutate(project.id)}
                    >
                      <Heart size={14} fill={liked ? "currentColor" : "none"} /> {likeCounts[project.id] ?? 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1"
                      onClick={() => setCommentingOn(commentingOn === project.id ? null : project.id)}
                    >
                      <MessageCircle size={14} /> {commentCounts[project.id] ?? 0}
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${bookmarked ? "text-primary" : ""}`}
                      onClick={() => bookmarkMutation.mutate(project.id)}
                    >
                      {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    </Button>
                  </div>

                  {/* Comment input */}
                  {commentingOn === project.id && (
                    <form
                      className="flex gap-2 mt-2"
                      onSubmit={e => {
                        e.preventDefault();
                        if (commentText.trim()) {
                          commentMutation.mutate({ projectId: project.id, content: commentText.trim() });
                        }
                      }}
                    >
                      <Input
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 h-9 text-sm"
                        autoFocus
                      />
                      <Button variant="hero" size="icon" className="h-9 w-9 shrink-0" type="submit">
                        <Send size={14} />
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Globe size={28} className="text-primary" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">No posts yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Create a public project and it will appear in the feed for everyone to see.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
