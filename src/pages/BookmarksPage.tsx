import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Trash2, Heart, MessageCircle, User } from "lucide-react";

export default function BookmarksPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ["bookmarks-page"],
    queryFn: async () => {
      const { data: bms } = await supabase
        .from("bookmarks")
        .select("project_id, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (!bms?.length) return [];

      const result = [];
      for (const bm of bms) {
        const { data: project } = await supabase.from("projects").select("*").eq("id", bm.project_id).single();
        if (project) {
          const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", project.user_id).single();
          result.push({ ...project, creator: profile, bookmarked_at: bm.created_at });
        }
      }
      return result;
    },
    enabled: !!user,
  });

  const removeBookmark = useMutation({
    mutationFn: async (projectId: string) => {
      await supabase.from("bookmarks").delete().eq("user_id", user!.id).eq("project_id", projectId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookmarks-page"] }),
  });

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
          Bookmarks<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Projects you've saved for later.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : bookmarks.length > 0 ? (
        <div className="space-y-3">
          {bookmarks.map((project: any) => (
            <Card key={project.id} className="border-border/50 hover:border-primary/20 transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                {project.cover_url ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                    <img src={project.cover_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Bookmark size={20} className="text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-sm truncate">{project.title}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {project.creator?.avatar_url ? (
                        <img src={project.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={8} className="text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{project.creator?.display_name || "Artist"}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeBookmark.mutate(project.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Bookmark size={28} className="text-primary" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-1">No bookmarks</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Save projects from the feed to find them here later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
