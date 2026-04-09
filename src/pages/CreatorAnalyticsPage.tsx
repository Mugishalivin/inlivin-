import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowUpRight, TrendingUp, Eye, Heart, MessageCircle, Users } from "lucide-react";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function CreatorAnalyticsPage() {
  const { user } = useAuth();

  const { data: analytics = [] } = useQuery({
    queryKey: ["creator", "analytics", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("creator_analytics")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false })
        .limit(90); // Last 90 days
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 300000, // 5 minutes
  });

  const latestStats = useMemo(() => analytics[0], [analytics]);

  const stats = useMemo(() => [
    { label: "Profile Views", value: latestStats?.profile_views || 0, icon: Eye, color: "text-blue-500" },
    { label: "Likes", value: latestStats?.likes_received || 0, icon: Heart, color: "text-red-500" },
    { label: "Comments", value: latestStats?.comments_received || 0, icon: MessageCircle, color: "text-amber-500" },
    { label: "Followers", value: latestStats?.total_followers || 0, icon: Users, color: "text-violet-500" },
  ], [latestStats]);

  const sortedAnalytics = useMemo(() => [...analytics].reverse(), [analytics]);

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          Your Analytics<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground mt-2">Track your growth and engagement metrics.</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const trend = analytics.length > 1 ? analytics[0][stat.label.toLowerCase().replace(" ", "_")] - analytics[1][stat.label.toLowerCase().replace(" ", "_")] : 0;
          return (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                  {trend > 0 && <ArrowUpRight className="w-4 h-4 text-green-500" />}
                </div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Engagement Trend */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Engagement Trend
          </CardTitle>
          <CardDescription>Last 30 days of likes, comments, and views</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sortedAnalytics.slice(0, 30)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)" }} />
              <Legend />
              <Line type="monotone" dataKey="likes_received" stroke="#ef4444" name="Likes" />
              <Line type="monotone" dataKey="comments_received" stroke="#10b981" name="Comments" />
              <Line type="monotone" dataKey="profile_views" stroke="#3b82f6" name="Views" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Revenue Generated</CardTitle>
            <CardDescription>Marketplace & commission earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary mb-4">
              ${analytics.reduce((sum, a) => sum + (a.revenue_generated || 0), 0).toFixed(2)}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sortedAnalytics.slice(0, 14)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.2)" }} />
                <Bar dataKey="revenue_generated" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trending Rank */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Trending Rank</CardTitle>
            <CardDescription>Your position in community rankings</CardDescription>
          </CardHeader>
          <CardContent>
            {latestStats?.trending_rank ? (
              <div className="text-center py-8">
                <div className="text-5xl font-bold text-primary mb-2">#{latestStats.trending_rank}</div>
                <p className="text-muted-foreground text-sm">You're in the top creators right now!</p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No ranking data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Detailed Daily Stats</CardTitle>
          <CardDescription>Last 30 days breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 font-semibold">Date</th>
                  <th className="text-right py-2 px-3 font-semibold">Views</th>
                  <th className="text-right py-2 px-3 font-semibold">Likes</th>
                  <th className="text-right py-2 px-3 font-semibold">Comments</th>
                  <th className="text-right py-2 px-3 font-semibold">New Followers</th>
                  <th className="text-right py-2 px-3 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sortedAnalytics.slice(0, 30).map((stat: any, idx: number) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-2 px-3">{new Date(stat.date).toLocaleDateString()}</td>
                    <td className="text-right py-2 px-3">{stat.profile_views}</td>
                    <td className="text-right py-2 px-3">{stat.likes_received}</td>
                    <td className="text-right py-2 px-3">{stat.comments_received}</td>
                    <td className="text-right py-2 px-3">{stat.new_followers}</td>
                    <td className="text-right py-2 px-3 text-primary font-semibold">${stat.revenue_generated?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
