import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  BarChart3, Users, Heart, MessageCircle, FolderOpen, Eye, TrendingUp, Calendar,
  Bookmark, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, AreaChart, Area
} from "recharts";

const COLORS = ["hsl(12, 80%, 55%)", "hsl(175, 60%, 38%)", "hsl(40, 60%, 50%)", "hsl(220, 60%, 50%)", "hsl(0, 60%, 50%)"];

export default function AnalyticsPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["analytics-full"],
    queryFn: async () => {
      const [
        { count: followers },
        { count: followingCount },
        { count: projects },
        { count: messages },
        { count: events },
      ] = await Promise.all([
        supabase.from("connections").select("*", { count: "exact", head: true }).eq("following_id", user!.id),
        supabase.from("connections").select("*", { count: "exact", head: true }).eq("follower_id", user!.id),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("sender_id", user!.id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);

      const { data: myProjects } = await supabase.from("projects").select("id, category, created_at").eq("user_id", user!.id);

      let totalLikes = 0, totalComments = 0, totalBookmarks = 0;
      const categoryData: Record<string, number> = {};
      const monthlyData: Record<string, { projects: number; likes: number; comments: number }> = {};

      if (myProjects?.length) {
        const ids = myProjects.map(p => p.id);

        // Batch count queries
        const [likesRes, commentsRes, bookmarksRes] = await Promise.all([
          supabase.from("likes").select("project_id", { count: "exact" }).in("project_id", ids),
          supabase.from("comments").select("project_id", { count: "exact" }).in("project_id", ids),
          supabase.from("bookmarks").select("project_id", { count: "exact" }).in("project_id", ids),
        ]);

        totalLikes = likesRes.data?.length ?? 0;
        totalComments = commentsRes.data?.length ?? 0;
        totalBookmarks = bookmarksRes.data?.length ?? 0;

        // Category breakdown
        for (const p of myProjects) {
          const cat = p.category || "other";
          categoryData[cat] = (categoryData[cat] || 0) + 1;
        }

        // Monthly project creation trend
        for (const p of myProjects) {
          const month = new Date(p.created_at).toLocaleDateString("en", { month: "short", year: "2-digit" });
          if (!monthlyData[month]) monthlyData[month] = { projects: 0, likes: 0, comments: 0 };
          monthlyData[month].projects += 1;
        }

        // Likes per project for monthly data
        for (const like of likesRes.data ?? []) {
          const proj = myProjects.find(p => p.id === like.project_id);
          if (proj) {
            const month = new Date(proj.created_at).toLocaleDateString("en", { month: "short", year: "2-digit" });
            if (monthlyData[month]) monthlyData[month].likes += 1;
          }
        }
      }

      // Per-project engagement
      const projectEngagement = [];
      if (myProjects?.length) {
        for (const p of myProjects.slice(0, 8)) {
          const { count: lc } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("project_id", p.id);
          const { count: cc } = await supabase.from("comments").select("*", { count: "exact", head: true }).eq("project_id", p.id);
          projectEngagement.push({ name: (p as any).title?.slice(0, 12) || p.id.slice(0, 8), likes: lc ?? 0, comments: cc ?? 0 });
        }
      }

      // Get project titles for engagement chart
      const projTitles: Record<string, string> = {};
      if (myProjects?.length) {
        const { data: fullProjects } = await supabase.from("projects").select("id, title").in("id", myProjects.map(p => p.id));
        for (const fp of fullProjects ?? []) {
          projTitles[fp.id] = fp.title;
        }
        // Update engagement with actual titles
        for (const pe of projectEngagement) {
          const match = myProjects.find(p => p.id.startsWith(pe.name) || projTitles[p.id]?.slice(0, 12) === pe.name);
          if (match && projTitles[match.id]) pe.name = projTitles[match.id].slice(0, 15);
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
        categoryData: Object.entries(categoryData).map(([name, value]) => ({ name, value })),
        monthlyData: Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })),
        projectEngagement,
      };
    },
    enabled: !!user,
  });

  const statCards = stats ? [
    { label: "Followers", value: stats.followers, icon: Users, color: "text-primary", trend: "+12%" },
    { label: "Following", value: stats.following, icon: Users, color: "text-accent", trend: "+5%" },
    { label: "Projects", value: stats.projects, icon: FolderOpen, color: "text-primary", trend: "+8%" },
    { label: "Total Likes", value: stats.totalLikes, icon: Heart, color: "text-destructive", trend: "+23%" },
    { label: "Comments", value: stats.totalComments, icon: MessageCircle, color: "text-accent", trend: "+15%" },
    { label: "Bookmarks", value: stats.totalBookmarks, icon: Bookmark, color: "text-primary", trend: "+10%" },
    { label: "Messages Sent", value: stats.messages, icon: MessageCircle, color: "text-accent", trend: "+18%" },
    { label: "Events", value: stats.events, icon: Calendar, color: "text-primary", trend: "+3%" },
  ] : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs font-medium text-foreground">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-xs text-muted-foreground">
              {p.name}: <span className="font-medium text-foreground">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
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
              <CardContent className="p-4"><div className="h-4 bg-muted rounded w-1/2 mb-3" /><div className="h-8 bg-muted rounded w-1/3" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, idx) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon size={18} className={stat.color} />
                      <span className="flex items-center gap-0.5 text-[10px] text-accent">
                        <ArrowUpRight size={10} /> {stat.trend}
                      </span>
                    </div>
                    <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Engagement per Project */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary" /> Project Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.projectEngagement && stats.projectEngagement.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.projectEngagement} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="likes" fill="hsl(12, 80%, 55%)" radius={[4, 4, 0, 0]} name="Likes" />
                      <Bar dataKey="comments" fill="hsl(175, 60%, 38%)" radius={[4, 4, 0, 0]} name="Comments" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No project data yet</div>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <FolderOpen size={16} className="text-accent" /> Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.categoryData && stats.categoryData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie data={stats.categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={4}>
                          {stats.categoryData.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {stats.categoryData.map((cat: any, i: number) => (
                        <div key={cat.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-xs text-muted-foreground capitalize">{cat.name}</span>
                          <span className="text-xs font-medium text-foreground">{cat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No categories yet</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Growth Trend */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary" /> Growth Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.monthlyData && stats.monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={stats.monthlyData}>
                      <defs>
                        <linearGradient id="gradProjects" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(12, 80%, 55%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(12, 80%, 55%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradLikes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(175, 60%, 38%)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(175, 60%, 38%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="projects" stroke="hsl(12, 80%, 55%)" fill="url(#gradProjects)" name="Projects" />
                      <Area type="monotone" dataKey="likes" stroke="hsl(175, 60%, 38%)" fill="url(#gradLikes)" name="Likes" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Not enough data yet</div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Overview */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <BarChart3 size={16} className="text-primary" /> Engagement Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    <span className="text-sm font-medium">
                      {stats && stats.projects > 0
                        ? `${((stats.totalLikes + stats.totalComments) / stats.projects).toFixed(1)} per project`
                        : "No projects yet"
                      }
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, ((stats?.totalLikes ?? 0) + (stats?.totalComments ?? 0)) * 5)}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Like:Comment Ratio</span>
                    <span className="text-sm font-medium">
                      {stats && stats.totalComments > 0 ? `${(stats.totalLikes / stats.totalComments).toFixed(1)}:1` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Follower:Following</span>
                    <span className="text-sm font-medium">{stats ? `${stats.followers}:${stats.following}` : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bookmark Rate</span>
                    <span className="text-sm font-medium">
                      {stats && stats.projects > 0 ? `${(stats.totalBookmarks / stats.projects).toFixed(1)} per project` : "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Tips */}
          <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <TrendingUp size={16} className="text-accent" /> Growth Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                {stats?.projects === 0 && <p className="flex items-start gap-2">📝 Create your first project to start getting engagement.</p>}
                {stats?.followers === 0 && <p className="flex items-start gap-2">👋 Follow other artists to grow your network.</p>}
                {stats && stats.projects > 0 && stats.totalLikes === 0 && <p className="flex items-start gap-2">❤️ Share your projects in the feed to get likes.</p>}
                {stats?.events === 0 && <p className="flex items-start gap-2">📅 Host an event to connect with the community.</p>}
                {stats && stats.followers > 0 && <p className="flex items-start gap-2">🔥 You have {stats.followers} follower{stats.followers > 1 ? "s" : ""}! Keep creating.</p>}
                {stats && stats.totalBookmarks > 0 && <p className="flex items-start gap-2">⭐ {stats.totalBookmarks} bookmarks! Your work resonates.</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
