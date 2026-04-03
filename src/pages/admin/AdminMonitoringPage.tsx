import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, RefreshCw, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function AdminMonitoringPage() {
  const queryClient = useQueryClient();
  const { data: sessions = [] } = useQuery({
    queryKey: ["admin", "monitoring-sessions"],
    queryFn: async () => (await supabase.from("call_sessions").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  const { data: events = [] } = useQuery({
    queryKey: ["admin", "monitoring-events"],
    queryFn: async () => (await supabase.from("admin_monitoring_events").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  const { data: updateComments = [] } = useQuery({
    queryKey: ["admin", "monitoring-update-comments"],
    queryFn: async () => (await supabase.from("update_comments").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const chartData = useMemo(() => {
    const byDay = new Map<string, { day: string; sessions: number; failures: number; events: number }>();
    for (const session of sessions as any[]) {
      const day = new Date(session.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const row = byDay.get(day) ?? { day, sessions: 0, failures: 0, events: 0 };
      row.sessions += 1;
      if (session.status === "failed" || session.status === "ended") row.failures += 1;
      byDay.set(day, row);
    }
    for (const event of events as any[]) {
      const day = new Date(event.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const row = byDay.get(day) ?? { day, sessions: 0, failures: 0, events: 0 };
      row.events += 1;
      byDay.set(day, row);
    }
    return Array.from(byDay.values()).slice(-8);
  }, [sessions, events]);

  const activeCount = (sessions as any[]).filter((item) => item.status === "active").length;
  const failedCount = (sessions as any[]).filter((item) => item.status === "failed").length;
  const recentSeverity = (events as any[]).filter((item) => item.severity !== "info").length;
  const commentCount = (updateComments as any[]).length;

  const emitHeartbeat = async () => {
    await supabase.from("admin_monitoring_events").insert([
      {
        event_type: "heartbeat",
        severity: "info",
        source: "admin",
        message: "Admin page heartbeat received",
      },
    ]);
    queryClient.invalidateQueries({ queryKey: ["admin", "monitoring-events"] });
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-cyan-300" />
              Monitoring
            </CardTitle>
            <CardDescription className="text-slate-300">Watch live sessions, system events, and health checks from one screen.</CardDescription>
          </div>
          <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={emitHeartbeat}>
            <ShieldCheck className="h-4 w-4" />
            Emit heartbeat
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <MiniStat label="Active sessions" value={activeCount} />
          <MiniStat label="Failed sessions" value={failedCount} />
          <MiniStat label="Alerts" value={recentSeverity + commentCount} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Trend line</CardTitle>
            <CardDescription className="text-slate-300">Sessions, failures, and events grouped by day.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke="#22d3ee" strokeWidth={2} />
                <Line type="monotone" dataKey="failures" stroke="#fb7185" strokeWidth={2} />
                <Line type="monotone" dataKey="events" stroke="#a78bfa" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Session health</CardTitle>
            <CardDescription className="text-slate-300">A quick status bar for session activity.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="sessions" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                <Bar dataKey="events" fill="#a78bfa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Live events</CardTitle>
          <CardDescription className="text-slate-300">Recent system events and checks.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-300">Type</TableHead>
                <TableHead className="text-slate-300">Severity</TableHead>
                <TableHead className="text-slate-300">Source</TableHead>
                <TableHead className="text-slate-300">Message</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(events as any[]).slice(0, 10).map((event) => (
                <TableRow key={event.id} className="border-white/10">
                  <TableCell className="text-white">{event.event_type}</TableCell>
                  <TableCell><Badge className="border-white/10 bg-white/10 text-white">{event.severity}</Badge></TableCell>
                  <TableCell className="text-slate-300">{event.source}</TableCell>
                  <TableCell className="text-slate-300">{event.message}</TableCell>
                  <TableCell className="text-slate-400">{new Date(event.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!events.length && (
                <TableRow className="border-white/10">
                  <TableCell colSpan={5} className="py-10 text-center text-slate-400">No monitoring events yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Update comments</CardTitle>
          <CardDescription className="text-slate-300">Comments submitted by users on announcements, promotions, and ads.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-300">Entity</TableHead>
                <TableHead className="text-slate-300">Comment</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(updateComments as any[]).slice(0, 10).map((comment) => (
                <TableRow key={comment.id} className="border-white/10">
                  <TableCell className="text-white">{comment.entity_type} / {comment.entity_id}</TableCell>
                  <TableCell className="text-slate-300">{comment.content}</TableCell>
                  <TableCell className="text-slate-400">{new Date(comment.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!updateComments.length && (
                <TableRow className="border-white/10">
                  <TableCell colSpan={3} className="py-10 text-center text-slate-400">No update comments yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin"] })}>
        <RefreshCw className="h-4 w-4" />
        Refresh admin caches
      </Button>
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
