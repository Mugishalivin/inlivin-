import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchAdminProfiles } from "@/lib/admin-profiles";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin", "analytics-profiles"],
    queryFn: async () => (await fetchAdminProfiles()).slice(0, 50),
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ["admin", "analytics-sessions"],
    queryFn: async () => (await supabase.from("call_sessions").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["admin", "analytics-audit"],
    queryFn: async () => (await supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  const { data: announcements = [] } = useQuery({
    queryKey: ["admin", "analytics-announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });

  const lineData = useMemo(() => {
    const buckets = new Map<string, { day: string; dau: number; errors: number; actions: number }>();
    for (const profile of profiles as any[]) {
      if (!profile.last_seen_at) continue;
      const day = new Date(profile.last_seen_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const row = buckets.get(day) ?? { day, dau: 0, errors: 0, actions: 0 };
      row.dau += 1;
      buckets.set(day, row);
    }
    for (const session of sessions as any[]) {
      const day = new Date(session.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const row = buckets.get(day) ?? { day, dau: 0, errors: 0, actions: 0 };
      if (session.status === "failed") row.errors += 1;
      buckets.set(day, row);
    }
    for (const entry of auditLogs as any[]) {
      const day = new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const row = buckets.get(day) ?? { day, dau: 0, errors: 0, actions: 0 };
      row.actions += 1;
      buckets.set(day, row);
    }
    return Array.from(buckets.values()).slice(-8);
  }, [profiles, sessions, auditLogs]);

  const topUsers = useMemo(() => {
    return [...(profiles as any[])].sort((a, b) => new Date(String(b.last_seen_at || b.created_at)).getTime() - new Date(String(a.last_seen_at || a.created_at)).getTime()).slice(0, 8);
  }, [profiles]);

  const contentMix = useMemo(() => [
    { name: "Announcements", value: (announcements as any[]).length },
    { name: "Calls", value: (sessions as any[]).length },
    { name: "Audit", value: (auditLogs as any[]).length },
  ], [announcements, sessions, auditLogs]);

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5 text-cyan-300" />
            Analytics
          </CardTitle>
          <CardDescription className="text-slate-300">DAU, conversion-style activity ratios, session length, and top lists.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <MiniStat label="DAU" value={(profiles as any[]).filter((profile) => profile.last_seen_at && Date.now() - new Date(profile.last_seen_at).getTime() < 24 * 60 * 60 * 1000).length} />
          <MiniStat label="Active sessions" value={(sessions as any[]).filter((session) => session.status === "active").length} />
          <MiniStat label="Audit actions" value={(auditLogs as any[]).length} />
          <MiniStat label="Posts" value={(announcements as any[]).length} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Trend chart</CardTitle>
            <CardDescription className="text-slate-300">A compact view of activity and errors over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="dau" stroke="#22d3ee" strokeWidth={2} />
                <Line type="monotone" dataKey="errors" stroke="#fb7185" strokeWidth={2} />
                <Line type="monotone" dataKey="actions" stroke="#a78bfa" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Content mix</CardTitle>
            <CardDescription className="text-slate-300">Track how much is moving through the system.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contentMix}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Top active users</CardTitle>
            <CardDescription className="text-slate-300">Ordered by latest visibility.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-300">User</TableHead>
                  <TableHead className="text-slate-300">Last seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((profile: any) => (
                  <TableRow key={profile.user_id} className="border-white/10">
                    <TableCell className="text-white">{profile.display_name || profile.username || profile.user_id}</TableCell>
                    <TableCell className="text-slate-400">{profile.last_seen_at ? new Date(profile.last_seen_at).toLocaleString() : "Never"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Latest posts</CardTitle>
            <CardDescription className="text-slate-300">Recent content that contributes to the system surface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(announcements as any[]).slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="font-semibold text-white">{item.title}</div>
                <div className="mt-1 line-clamp-2 text-sm text-slate-300">{item.content}</div>
                <Badge className="mt-3 border-white/10 bg-white/10 text-white">{item.is_active ? "Active" : "Inactive"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
    </div>
  );
}
