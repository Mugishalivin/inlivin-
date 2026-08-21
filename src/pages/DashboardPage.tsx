import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  Compass,
  Eye,
  FolderOpen,
  Heart,
  Layers3,
  Lightbulb,
  MessageCircle,
  Rocket,
  Sparkles,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingStatGrid } from "@/components/LoadingSkeletons";

const quickActions = [
  { label: "New Project", icon: FolderOpen, href: "/projects", color: "text-primary" },
  { label: "Studio", icon: Layers3, href: "/studio", color: "text-accent" },
  { label: "Messages", icon: MessageCircle, href: "/messages", color: "text-primary" },
  { label: "Feed", icon: Compass, href: "/feed", color: "text-accent" },
  { label: "Events", icon: Calendar, href: "/events", color: "text-primary" },
  { label: "Analytics", icon: BarChart3, href: "/analytics", color: "text-accent" },
];

const activityIcons: Record<string, typeof Sparkles> = {
  follow: Users,
  like: Heart,
  comment: MessageCircle,
  message: MessageCircle,
  event: Calendar,
  default: Sparkles,
};

function monthLabel(date: string) {
  return new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [followersRes, projectsRes, unreadNotifsRes, convoPartsRes, likesRes, commentsRes] = await Promise.all([
        supabase.from("connections").select("*", { count: "exact", head: true }).eq("following_id", user!.id),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("is_read", false),
        supabase.from("conversation_participants").select("conversation_id").eq("user_id", user!.id),
        supabase.from("likes").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);

      return {
        followers: followersRes.count ?? 0,
        projects: projectsRes.count ?? 0,
        notifications: unreadNotifsRes.count ?? 0,
        conversations: convoPartsRes.data?.length ?? 0,
        likes: likesRes.count ?? 0,
        comments: commentsRes.count ?? 0,
      };
    },
    enabled: !!user,
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: upcomingEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["dashboard-events"],
    queryFn: async () => {
      const { data: rsvps } = await supabase.from("event_rsvps").select("event_id").eq("user_id", user!.id);
      if (!rsvps?.length) return [];
      const ids = rsvps.map((r) => r.event_id);
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .in("id", ids)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(3);
      return events ?? [];
    },
    enabled: !!user,
  });

  const { data: recentProjects = [] } = useQuery({
    queryKey: ["dashboard-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, category, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
    enabled: !!user,
  });

  const activitySummary = useMemo(() => {
    const likes = stats?.likes ?? 0;
    const comments = stats?.comments ?? 0;
    const projects = stats?.projects ?? 0;
    const followerRatio = projects > 0 ? ((likes + comments) / projects).toFixed(1) : "0.0";

    return [
      { title: "Project velocity", value: projects, helper: "Published works", icon: FolderOpen, tone: "text-primary" },
      { title: "Audience signal", value: stats?.followers ?? 0, helper: "Followers connected", icon: Users, tone: "text-accent" },
      { title: "Engagement score", value: followerRatio, helper: "Actions per project", icon: Heart, tone: "text-destructive" },
    ];
  }, [stats]);

  const nextActions = useMemo(() => {
    if (!stats) return [];
    const actions = [];
    if (stats.projects === 0) {
      actions.push("Create your first project to establish a baseline.");
    } else if (stats.likes + stats.comments < stats.projects) {
      actions.push("Improve covers and titles to raise engagement on each project.");
    }
    if (stats.followers === 0) {
      actions.push("Use Studio to plan a launch and start a follower loop.");
    } else {
      actions.push("Double down on the category that gets the most reaction.");
    }
    if (stats.notifications > 0) {
      actions.push("Clear unread notifications so nothing important is missed.");
    }
    return actions.slice(0, 3);
  }, [stats]);

  const heroDeltas = [
    { label: "Followers", value: stats?.followers ?? 0 },
    { label: "Projects", value: stats?.projects ?? 0 },
    { label: "Alerts", value: stats?.notifications ?? 0 },
  ];

  return (
    <div className="relative p-6 md:p-8 max-w-6xl overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" animate={{ y: [0, 18, 0], x: [0, -10, 0] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute top-1/3 -left-16 h-64 w-64 rounded-full bg-accent/10 blur-3xl" animate={{ y: [0, -16, 0], x: [0, 12, 0] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }} />
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Daily command center
          </p>
          <h1 className="font-display text-3xl font-black md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-orange-400 to-accent bg-clip-text text-transparent">
              Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Here is your current creative pulse, what needs attention, and the next best move to keep momentum going.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {heroDeltas.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index }}
              className="rounded-2xl border border-border/50 bg-card/80 px-4 py-3 text-center shadow-sm backdrop-blur"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
              <p className="mt-1 font-display text-2xl font-black text-foreground">{item.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {statsLoading ? (
        <LoadingStatGrid count={4} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Followers", value: stats?.followers ?? 0, icon: Users, color: "text-primary" },
              { label: "Projects", value: stats?.projects ?? 0, icon: FolderOpen, color: "text-accent" },
              { label: "Conversations", value: stats?.conversations ?? 0, icon: MessageCircle, color: "text-primary" },
              { label: "Notifications", value: stats?.notifications ?? 0, icon: Bell, color: "text-accent" },
            ].map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="border-border/50 bg-card/90 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon size={18} className={stat.color} />
                      <Zap size={12} className="text-muted-foreground" />
                    </div>
                    <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-6">
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Wand2 size={18} className="text-primary" />
                    Next best actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3">
                  {nextActions.length ? nextActions.map((item, index) => (
                    <motion.div key={item} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-xl border border-border/50 bg-card/80 p-4 text-sm text-foreground">
                      {item}
                    </motion.div>
                  )) : (
                    <p className="text-sm text-muted-foreground">Add more data to unlock tailored actions.</p>
                  )}
                </CardContent>
              </Card>

              {activityLoading ? (
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <Zap size={18} className="text-primary" /> Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-primary/10" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <Zap size={18} className="text-primary" /> Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                    ) : (
                      recentActivity.map((item: { id: string; type: string; title: string; created_at: string }) => {
                        const Icon = activityIcons[item.type] || activityIcons.default;
                        return (
                          <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Icon size={14} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">{item.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <Calendar size={16} className="text-accent" /> Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {eventsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
                        <div className="w-10 h-10 rounded-lg bg-accent/10" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event: { id: string; event_date: string; title: string; location: string | null }) => (
                      <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-bold text-accent">{monthLabel(event.event_date).split(" ")[0]}</span>
                          <span className="text-xs font-bold text-foreground">{new Date(event.event_date).getDate()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{event.title}</p>
                          {event.location && <p className="text-[11px] text-muted-foreground">{event.location}</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming events yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3 overflow-hidden">
                      {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users size={24} className="text-muted-foreground" />}
                    </div>
                    <h3 className="font-display font-bold text-foreground">{profile?.display_name || "Artist"}</h3>
                    {profile?.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
                    {profile?.location && <p className="text-[11px] text-muted-foreground mt-0.5">{profile.location}</p>}
                  </div>

                  {profile?.bio && <p className="text-xs text-muted-foreground text-center mb-3 line-clamp-3">{profile.bio}</p>}

                  <Button variant="hero-outline" size="sm" className="w-full" onClick={() => navigate("/settings")}>Edit Profile <ArrowRight size={14} /></Button>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-sm flex items-center gap-2"><Layers3 size={16} className="text-accent" /> Studio shortcut</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Plan launches, review what you should improve, and package your next move in one place.</p>
                  <Button variant="hero" size="sm" className="w-full" onClick={() => navigate("/studio")}>
                    Open Studio <ArrowRight size={14} />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-gradient-to-br from-background to-secondary/20">
                <CardContent className="p-5 text-center">
                  <Compass size={28} className="text-accent mx-auto mb-2" />
                  <h4 className="font-display font-bold text-sm text-foreground mb-1">Discover Artists</h4>
                  <p className="text-[11px] text-muted-foreground mb-3">Find collaborators, connect with creators in your genre.</p>
                  <Button variant="hero" size="sm" className="w-full" onClick={() => navigate("/search")}>
                    Explore <ArrowRight size={14} />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                onClick={() => navigate(action.href)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-3 transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/5"
              >
                <action.icon size={20} className={`${action.color} transition-transform group-hover:scale-110`} />
                <span className="text-[11px] font-medium text-foreground">{action.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {activitySummary.map((item) => (
              <Card key={item.title} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <item.icon size={18} className={item.tone} />
                    <Activity size={12} className="text-muted-foreground" />
                  </div>
                  <div className="mt-3 font-display text-2xl font-bold text-foreground">{item.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.title}</div>
                  <p className="mt-2 text-[11px] text-muted-foreground">{item.helper}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!statsLoading && recentProjects.length > 0 ? (
        <Card className="mt-6 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2"><Eye size={16} className="text-primary" /> Recent projects</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {recentProjects.map((project: { id: string; title: string | null; category: string | null; created_at: string }) => (
              <div key={project.id} className="rounded-xl border border-border/50 p-4 hover:border-primary/25 hover:shadow-md transition-all">
                <p className="font-semibold text-foreground line-clamp-1">{project.title || "Untitled project"}</p>
                <p className="mt-1 text-xs text-muted-foreground capitalize">{project.category || "uncategorized"}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{monthLabel(project.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
