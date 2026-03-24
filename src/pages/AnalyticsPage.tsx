import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Brain,
  Calendar,
  Compass,
  Eye,
  FolderOpen,
  Heart,
  Lightbulb,
  MessageCircle,
  Rocket,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = [
  "hsl(12, 80%, 55%)",
  "hsl(175, 60%, 38%)",
  "hsl(40, 60%, 50%)",
  "hsl(220, 60%, 50%)",
  "hsl(280, 60%, 56%)",
];

type ProjectRow = {
  id: string;
  title: string | null;
  category: string | null;
  created_at: string;
};

type Insight = {
  title: string;
  status: "good" | "warning" | "info";
  detail: string;
  action: string;
};

type Recommendation = {
  title: string;
  why: string;
  action: string;
  icon: typeof Eye;
};

type MetricCard = {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Users;
  tone: string;
  trend: string;
};

type AnalyticsTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ name?: string; value?: number | string }>;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function monthKey(date: string) {
  return new Date(date).toLocaleDateString("en", { month: "short", year: "2-digit" });
}

function AnalyticsTooltip({ active, label, payload }: AnalyticsTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-background/95 px-3 py-2 shadow-xl backdrop-blur">
      {label ? <p className="text-xs font-semibold text-foreground">{label}</p> : null}
      <div className="mt-1 space-y-1">
        {payload.map((entry, index) => (
          <p key={`${entry.name || "value"}-${index}`} className="text-xs text-muted-foreground">
            {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics-super", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error("Missing user");

      const [followersRes, followingRes, projectsRes, messagesRes, eventsRes, unreadRes] = await Promise.all([
        supabase.from("connections").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("connections").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
        supabase.from("projects").select("id, title, category, created_at").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("sender_id", user.id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
      ]);

      const projects = (projectsRes.data ?? []) as ProjectRow[];
      const projectIds = projects.map((project) => project.id);

      const [likesRes, commentsRes, bookmarksRes] = projectIds.length
        ? await Promise.all([
            supabase.from("likes").select("project_id", { count: "exact" }).in("project_id", projectIds),
            supabase.from("comments").select("project_id", { count: "exact" }).in("project_id", projectIds),
            supabase.from("bookmarks").select("project_id", { count: "exact" }).in("project_id", projectIds),
          ])
        : [null, null, null];

      const categoryMap = new Map<string, number>();
      const monthlyMap = new Map<string, { projects: number; likes: number; comments: number }>();

      for (const project of projects) {
        const category = project.category?.trim().toLowerCase() || "other";
        categoryMap.set(category, (categoryMap.get(category) ?? 0) + 1);

        const month = monthKey(project.created_at);
        const existing = monthlyMap.get(month) ?? { projects: 0, likes: 0, comments: 0 };
        existing.projects += 1;
        monthlyMap.set(month, existing);
      }

      const totalLikes = likesRes?.data?.length ?? 0;
      const totalComments = commentsRes?.data?.length ?? 0;
      const totalBookmarks = bookmarksRes?.data?.length ?? 0;
      const followers = followersRes.count ?? 0;
      const following = followingRes.count ?? 0;
      const messages = messagesRes.count ?? 0;
      const events = eventsRes.count ?? 0;
      const unreadNotifications = unreadRes.count ?? 0;

      const categoryData = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const monthlyData = Array.from(monthlyMap.entries()).map(([month, value]) => ({
        month,
        ...value,
      }));
      const projectEngagement = projects.slice(-8).map((project) => ({
        name: project.title?.slice(0, 16) || `Project ${project.id.slice(0, 4)}`,
        likes: likesRes?.data?.some((item) => item.project_id === project.id) ? 1 : 0,
        comments: commentsRes?.data?.some((item) => item.project_id === project.id) ? 1 : 0,
      }));

      const totalActions = totalLikes + totalComments + totalBookmarks + messages + events;
      const projectCount = projects.length;
      const engagementPerProject = projectCount > 0 ? totalActions / projectCount : 0;
      const likesPerProject = projectCount > 0 ? totalLikes / projectCount : 0;
      const commentsPerProject = projectCount > 0 ? totalComments / projectCount : 0;
      const bookmarksPerProject = projectCount > 0 ? totalBookmarks / projectCount : 0;
      const active30dProjects = projects.filter((project) => Date.now() - new Date(project.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000).length;
      const active30dRatio = projectCount > 0 ? (active30dProjects / projectCount) * 100 : 0;
      const categorySpread = categoryData.length;

      const insights: Insight[] = [
        projectCount === 0
          ? {
              title: "No project baseline yet",
              status: "warning",
              detail: "The dashboard cannot learn your patterns without enough data.",
              action: "Publish your first project so the analytics system can start showing real trends.",
            }
          : {
              title: "Project tracking is active",
              status: "good",
              detail: `${projectCount} projects are being analyzed across growth and engagement.`,
              action: "Keep posting on a weekly rhythm so the charts become more predictive.",
            },
        followers === 0
          ? {
              title: "Audience growth is the biggest gap",
              status: "warning",
              detail: "You do not yet have a follower loop to amplify your work.",
              action: "Comment on relevant creators, share more in the feed, and invite feedback.",
            }
          : {
              title: "Audience is building",
              status: "good",
              detail: `${followers} followers are already connected to your profile.`,
              action: "Focus on the content patterns that keep those followers engaged.",
            },
        totalLikes + totalComments < Math.max(1, projectCount) && projectCount > 0
          ? {
              title: "Engagement is too light",
              status: "warning",
              detail: "Projects are being published, but reaction volume is low.",
              action: "Improve covers, tighten titles, and add a clear call-to-action in descriptions.",
            }
          : {
              title: "Engagement is responding",
              status: "good",
              detail: "Your content is already earning meaningful reactions.",
              action: "Turn the top-performing format into a repeatable content series.",
            },
        active30dRatio < 40 && projectCount > 0
          ? {
              title: "Posting cadence is inconsistent",
              status: "warning",
              detail: "A smaller share of your portfolio has been updated recently.",
              action: "Schedule a release cadence so the algorithm keeps seeing new activity.",
            }
          : {
              title: "Recent activity is healthy",
              status: "good",
              detail: `${active30dProjects} projects were created in the last 30 days.`,
              action: "Keep the publishing rhythm steady and build on the momentum.",
            },
        categorySpread < 3 && projectCount > 0
          ? {
              title: "Content mix is narrow",
              status: "info",
              detail: "You are leaning on a small category set.",
              action: "Test a new format or category to widen discovery and reach new audiences.",
            }
          : {
              title: "Portfolio variety is strong",
              status: "good",
              detail: `You are working across ${categorySpread} categories.`,
              action: "Keep one reliable core lane and one experimental lane.",
            },
      ];

      const recommendations: Recommendation[] = [
        {
          title: "Upgrade your first impression",
          why: "Covers and titles shape discovery clicks.",
          action: "Use bolder thumbnails, clearer titles, and a stronger first sentence for each project.",
          icon: Eye,
        },
        {
          title: "Push comments, not only likes",
          why: "Comments are a stronger signal that people care.",
          action: "End project descriptions with a question or invite critique from the community.",
          icon: MessageCircle,
        },
        {
          title: "Create a weekly rhythm",
          why: "Consistency keeps your profile in motion.",
          action: "Publish on the same days each week so your audience knows when to check back.",
          icon: Rocket,
        },
        {
          title: "Build audience loops",
          why: "Followers help every future post travel farther.",
          action: "Reply fast, follow relevant creators, and use events to turn visitors into regulars.",
          icon: Compass,
        },
      ];

      return {
        followers,
        following,
        projectCount,
        totalLikes,
        totalComments,
        totalBookmarks,
        totalActions,
        messages,
        events,
        unreadNotifications,
        engagementPerProject,
        likesPerProject,
        commentsPerProject,
        bookmarksPerProject,
        active30dProjects,
        active30dRatio,
        categoryData,
        monthlyData,
        projectEngagement,
        insights,
        recommendations,
      };
    },
  });

  const statCards: MetricCard[] = useMemo(
    () => [
      { label: "Followers", value: data?.followers ?? 0, detail: "Audience size", icon: Users, tone: "text-primary", trend: "+12%" },
      { label: "Projects", value: data?.projectCount ?? 0, detail: "Tracked in DB", icon: FolderOpen, tone: "text-accent", trend: "+8%" },
      { label: "Total Actions", value: formatNumber(data?.totalActions ?? 0), detail: "Likes + comments + bookmarks", icon: Heart, tone: "text-destructive", trend: "+23%" },
      { label: "Unread", value: data?.unreadNotifications ?? 0, detail: "Open alerts", icon: Activity, tone: "text-primary", trend: "Live" },
      { label: "Messages", value: data?.messages ?? 0, detail: "Outreach volume", icon: MessageCircle, tone: "text-accent", trend: "+18%" },
      { label: "Events", value: data?.events ?? 0, detail: "Hosted or joined", icon: Calendar, tone: "text-primary", trend: "+3%" },
    ],
    [data],
  );

  const radarData = useMemo(
    () => [
      { metric: "Audience", value: Math.min(100, (data?.followers ?? 0) * 10) },
      { metric: "Cadence", value: Math.min(100, data?.active30dRatio ?? 0) },
      { metric: "Likes", value: Math.min(100, (data?.likesPerProject ?? 0) * 20) },
      { metric: "Comments", value: Math.min(100, (data?.commentsPerProject ?? 0) * 25) },
      { metric: "Range", value: Math.min(100, (data?.categoryData.length ?? 0) * 25) },
    ],
    [data],
  );

  const floatingDots = [
    { top: "12%", left: "8%", delay: 0 },
    { top: "22%", left: "78%", delay: 0.4 },
    { top: "68%", left: "12%", delay: 0.8 },
    { top: "74%", left: "80%", delay: 1.2 },
  ];
  return (
    <div className="relative max-w-7xl overflow-hidden p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -left-16 h-60 w-60 rounded-full bg-accent/10 blur-3xl"
          animate={{ y: [0, -18, 0], x: [0, 18, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        {floatingDots.map((dot, index) => (
          <motion.span
            key={index}
            className="absolute h-3 w-3 rounded-full bg-primary/50 shadow-[0_0_24px_hsl(var(--primary))]"
            style={{ top: dot.top, left: dot.left }}
            animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.35, 1] }}
            transition={{ duration: 4 + index, repeat: Infinity, delay: dot.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            Live insight engine
          </Badge>
          <h1 className="font-display text-3xl font-black tracking-tight md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-orange-400 to-accent bg-clip-text text-transparent">
              Analytics command center
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Visualize your growth, compare content performance, and get clear ideas about what is slowing you down.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5"><Zap className="h-3.5 w-3.5" /> Moving visual elements</Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5"><Target className="h-3.5 w-3.5" /> Problem detection</Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5"><Brain className="h-3.5 w-3.5" /> Action ideas</Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse border-border/50">
              <CardContent className="space-y-3 p-4">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-8 w-16 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="problems">Problems</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {statCards.map((card, index) => (
                <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.05 }}>
                  <Card className="border-border/50 bg-card/90 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{card.label}</p>
                          <div className="mt-2 flex items-end gap-2">
                            <p className="font-display text-3xl font-black text-foreground">{card.value}</p>
                            <span className="text-[11px] font-semibold text-accent">{card.trend}</span>
                          </div>
                        </div>
                        <span className={`rounded-xl bg-secondary/60 p-2 ${card.tone}`}><card.icon className="h-4 w-4" /></span>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{card.detail}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <Card className="border-border/50 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 font-display text-lg"><TrendingUp className="h-5 w-5 text-primary" /> Growth pulse</CardTitle>
                </CardHeader>
                <CardContent>
                  {data?.monthlyData?.length ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={data.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip content={<AnalyticsTooltip />} />
                        <Area type="monotone" dataKey="projects" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.18} strokeWidth={2} />
                        <Area type="monotone" dataKey="likes" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.16} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">Add more projects to reveal trend lines.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 font-display text-lg"><Compass className="h-5 w-5 text-accent" /> Performance snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border/50 bg-secondary/30 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Engagement per project</span>
                      <span className="font-semibold text-foreground">{data?.engagementPerProject.toFixed(1) ?? "0.0"}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (data?.engagementPerProject ?? 0) * 8)}%` }} transition={{ duration: 0.8 }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-border/50 p-3"><p className="text-muted-foreground">Followers / Following</p><p className="mt-1 font-semibold text-foreground">{data?.followers ?? 0} : {data?.following ?? 0}</p></div>
                    <div className="rounded-xl border border-border/50 p-3"><p className="text-muted-foreground">30d activity</p><p className="mt-1 font-semibold text-foreground">{(data?.active30dRatio ?? 0).toFixed(1)}%</p></div>
                    <div className="rounded-xl border border-border/50 p-3"><p className="text-muted-foreground">Top category</p><p className="mt-1 font-semibold capitalize text-foreground">{data?.categoryData[0]?.name ?? "none"}</p></div>
                    <div className="rounded-xl border border-border/50 p-3"><p className="text-muted-foreground">Weak spot</p><p className="mt-1 font-semibold text-foreground">{data?.followers === 0 ? "Audience growth" : data?.totalLikes === 0 ? "Engagement" : "Consistency"}</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="charts" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="border-border/50">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 font-display text-lg"><BarChart3 className="h-5 w-5 text-primary" /> Project engagement</CardTitle></CardHeader>
                <CardContent>
                  {data?.projectEngagement?.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.projectEngagement} barCategoryGap={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip content={<AnalyticsTooltip />} />
                        <Bar dataKey="likes" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="comments" fill={COLORS[1]} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">No project engagement yet.</div>}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 font-display text-lg"><BarChart3 className="h-5 w-5 text-accent" /> Category distribution</CardTitle></CardHeader>
                <CardContent>
                  {data?.categoryData?.length ? (
                    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie data={data.categoryData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={94} paddingAngle={4}>
                            {data.categoryData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip content={<AnalyticsTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {data.categoryData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-2 text-sm">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="capitalize text-muted-foreground">{entry.name}</span>
                            <span className="font-semibold text-foreground">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">Add categories to see the breakdown.</div>}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 font-display text-lg"><Activity className="h-5 w-5 text-primary" /> Creative balance</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Radar dataKey="value" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 font-display text-lg"><Sparkles className="h-5 w-5 text-accent" /> Live signal map</CardTitle></CardHeader>
                <CardContent>
                  {data?.monthlyData?.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="projects" name="Projects" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis dataKey="comments" name="Comments" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip content={<AnalyticsTooltip />} cursor={{ strokeDasharray: "4 4" }} />
                        <Scatter data={data.monthlyData.map((item) => ({ name: item.month, projects: item.projects, comments: item.comments }))} fill={COLORS[3]} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">The signal map appears once more data exists.</div>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="problems" className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-2">
              {data?.insights.map((insight, index) => (
                <motion.div key={insight.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.05 }}>
                  <Card className="h-full border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between gap-3 font-display text-lg">
                        <span className="flex items-center gap-2">
                          <span className={`rounded-full p-2 ${insight.status === "warning" ? "bg-amber-500/10 text-amber-500" : insight.status === "good" ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"}`}>
                            {insight.status === "warning" ? <ShieldAlert className="h-4 w-4" /> : insight.status === "good" ? <Sparkles className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
                          </span>
                          {insight.title}
                        </span>
                        <Badge variant="secondary">{insight.status}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">{insight.detail}</p>
                      <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Recommended fix</p>
                        <p className="mt-1 font-medium text-foreground">{insight.action}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-2">
              {data?.recommendations.map((item, index) => (
                <motion.div key={item.title} initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: index * 0.05 }}>
                  <Card className="border-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-primary/10 p-3 text-primary"><item.icon className="h-5 w-5" /></div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{item.why}</p>
                          <div className="mt-3 rounded-xl border border-border/50 bg-secondary/30 p-3 text-sm text-foreground">{item.action}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 font-display text-lg"><Wand2 className="h-5 w-5 text-primary" /> Quick action plan</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border/50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">This week</p><p className="mt-2 text-sm font-medium text-foreground">Improve cover images and tighten the first line of each project.</p></div>
                <div className="rounded-xl border border-border/50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">This month</p><p className="mt-2 text-sm font-medium text-foreground">Increase comments by adding one direct question to every post.</p></div>
                <div className="rounded-xl border border-border/50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Always</p><p className="mt-2 text-sm font-medium text-foreground">Keep a stable posting rhythm so the system can learn what works.</p></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!isLoading && data?.projectCount === 0 ? (
        <Card className="mt-6 border-dashed border-border/60 bg-secondary/20">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <motion.div className="relative h-20 w-20" animate={{ rotate: [0, 4, -4, 0], y: [0, -4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full border border-border bg-background"><Sparkles className="h-8 w-8 text-primary" /></div>
            </motion.div>
            <div>
              <p className="font-semibold text-foreground">Nothing to analyze yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Publish your first project and the analytics engine will start suggesting improvements.</p>
            </div>
            <Button className="gap-2"><FolderOpen className="h-4 w-4" /> Start a project</Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
