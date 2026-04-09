import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Trash2, Heart, MessageCircle, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BookmarksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projectBookmarks = [], isLoading: projectsLoading } = useQuery({
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
          result.push({ ...project, creator: profile, bookmarked_at: bm.created_at, type: "project" });
        }
      }
      return result;
    },
    enabled: !!user,
  });

  const { data: eventBookmarks = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["event-bookmarks-page"],
    queryFn: async () => {
      const { data: bms } = await supabase
        .from("event_bookmarks")
        .select("event_id, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (!bms?.length) return [];

      const result = [];
      for (const bm of bms) {
        const { data: event } = await supabase.from("events").select("*").eq("id", bm.event_id).single();
        if (event) {
          const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", event.user_id).single();
          result.push({ ...event, creator: profile, bookmarked_at: bm.created_at, type: "event" });
        }
      }
      return result;
    },
    enabled: !!user,
  });

  const allBookmarks = [...projectBookmarks, ...eventBookmarks].sort(
    (a, b) => new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime()
  );
  const isLoading = projectsLoading || eventsLoading;

  const removeBookmark = useMutation({
    mutationFn: async (item: any) => {
      if (item.type === "project") {
        await supabase.from("bookmarks").delete().eq("user_id", user!.id).eq("project_id", item.id);
      } else if (item.type === "event") {
        await supabase.from("event_bookmarks").delete().eq("user_id", user!.id).eq("event_id", item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks-page"] });
      queryClient.invalidateQueries({ queryKey: ["event-bookmarks-page"] });
    },
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
      ) : allBookmarks.length > 0 ? (
        <div className="space-y-3">
          {allBookmarks.map((item: any) => (
            <Card 
              key={`${item.type}-${item.id}`} 
              className="border-border/50 hover:border-primary/20 transition-all cursor-pointer" 
              onClick={() => navigate(item.type === "project" ? `/projects/${item.id}` : `/events/${item.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {item.type === "project" ? (
                  item.cover_url ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                      <img src={item.cover_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Bookmark size={20} className="text-muted-foreground/30" />
                    </div>
                  )
                ) : (
                  item.cover_url ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                      <img src={item.cover_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Bookmark size={20} className="text-muted-foreground/30" />
                    </div>
                  )
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-display font-bold text-sm truncate">{item.title}</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                      {item.type === "project" ? "Project" : "Event"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {item.creator?.avatar_url ? (
                        <img src={item.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={8} className="text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{item.creator?.display_name || "Artist"}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBookmark.mutate(item);
                  }}
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
