import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3, Users, Heart, MessageCircle, FolderOpen, Eye, TrendingUp, Calendar
} from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      // Follower count
      const { count: followers } = await supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user!.id);

      // Following count
      const { count: followingCount } = await supabase
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user!.id);

      // Projects count
      const { count: projects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);

      // Total likes on my projects
      const { data: myProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user!.id);

      let totalLikes = 0;
      let totalComments = 0;
      if (myProjects?.length) {
        const ids = myProjects.map(p => p.id);
        for (const id of ids) {
          const { count: lc } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("project_id", id);
          totalLikes += lc ?? 0;
          const { count: cc } = await supabase.from("comments").select("*", { count: "exact", head: true }).eq("project_id", id);
          totalComments += cc ?? 0;
        }
      }

      // Messages count
      const { count: messages } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", user!.id);

      // Events created
      const { count: events } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);

      // Bookmarks received
      let totalBookmarks = 0;
      if (myProjects?.length) {
        for (const p of myProjects) {
          const { count } = await supabase.from("bookmarks").select("*", { count: "exact", head: true }).eq("project_id", p.id);
          totalBookmarks += count ?? 0;
        }
      }

      return {
        followers: followers ?? 0,
        following: followingCount ?? 0,
        projects: projects ?? 0,
        totalLikes,
        totalComments,
        messages: messages ?? 0,
        events: events ?? 0,
        totalBookmarks,
      };
    },
    enabled: !!user,
  });

  const statCards = stats ? [
    { label: "Followers", value: stats.followers, icon: Users, color: "text-primary" },
    { label: "Following", value: stats.following, icon: Users, color: "text-accent" },
    { label: "Projects", value: stats.projects, icon: FolderOpen, color: "text-primary" },
    { label: "Total Likes", value: stats.totalLikes, icon: Heart, color: "text-destructive" },
    { label: "Comments", value: stats.totalComments, icon: MessageCircle, color: "text-accent" },
    { label: "Bookmarks", value: stats.totalBookmarks, icon: Eye, color: "text-primary" },
    { label: "Messages Sent", value: stats.messages, icon: MessageCircle, color: "text-accent" },
    { label: "Events", value: stats.events, icon: Calendar, color: "text-primary" },
  ] : [];

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
          Analytics<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Your creative impact at a glance.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Card key={i} className="border-border/50 animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/2 mb-3" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map(stat => (
              <Card key={stat.label} className="border-border/50 hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon size={18} className={stat.color} />
                    <TrendingUp size={12} className="text-muted-foreground" />
                  </div>
                  <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary" /> Engagement Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    <span className="text-sm font-medium">
                      {stats && stats.projects > 0
                        ? `${((stats.totalLikes + stats.totalComments) / stats.projects).toFixed(1)} per project`
                        : "No projects yet"
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Like:Comment Ratio</span>
                    <span className="text-sm font-medium">
                      {stats && stats.totalComments > 0
                        ? `${(stats.totalLikes / stats.totalComments).toFixed(1)}:1`
                        : "—"
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Follower:Following</span>
                    <span className="text-sm font-medium">
                      {stats ? `${stats.followers}:${stats.following}` : "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <TrendingUp size={16} className="text-accent" /> Growth Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {stats && stats.projects === 0 && (
                    <p>📝 Create your first project to start getting engagement.</p>
                  )}
                  {stats && stats.followers === 0 && (
                    <p>👋 Follow other artists to grow your network.</p>
                  )}
                  {stats && stats.projects > 0 && stats.totalLikes === 0 && (
                    <p>❤️ Share your projects in the feed to get likes.</p>
                  )}
                  {stats && stats.events === 0 && (
                    <p>📅 Host an event to connect with the community.</p>
                  )}
                  {stats && stats.followers > 0 && (
                    <p>🔥 You have {stats.followers} follower{stats.followers > 1 ? "s" : ""}! Keep creating.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
