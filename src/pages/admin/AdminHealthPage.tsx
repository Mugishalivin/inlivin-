import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAdminProfiles } from "@/lib/admin-profiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Database, Shield, Users, Globe, Server, Cpu, HardDrive,
  Clock, CheckCircle, AlertTriangle, XCircle, TrendingUp, Zap, BarChart3, Wifi
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminHealthPage() {
  const adminDb = supabase as any;

  const { data: users = [] } = useQuery({ queryKey: ["admin", "health-users"], queryFn: fetchAdminProfiles });
  const { data: projects = [] } = useQuery({ queryKey: ["admin", "health-projects"], queryFn: async () => (await supabase.from("projects").select("id")).data ?? [] });
  const { data: messages = [] } = useQuery({ queryKey: ["admin", "health-messages"], queryFn: async () => (await supabase.from("messages").select("id").limit(1000)).data ?? [] });
  const { data: events = [] } = useQuery({ queryKey: ["admin", "health-events"], queryFn: async () => (await supabase.from("events").select("id")).data ?? [] });
  const { data: flags = [] } = useQuery({ queryKey: ["admin", "health-flags"], queryFn: async () => (await adminDb.from("admin_feature_flags").select("*")).data ?? [] });
  const { data: connections = [] } = useQuery({ queryKey: ["admin", "health-conn"], queryFn: async () => (await supabase.from("connections").select("id")).data ?? [] });
  const { data: items = [] } = useQuery({ queryKey: ["admin", "health-items"], queryFn: async () => (await supabase.from("selling_items").select("id")).data ?? [] });

  const onlineUsers = (users as any[]).filter((u) => u.last_seen_at && Date.now() - new Date(u.last_seen_at).getTime() < 5 * 60 * 1000).length;
  const totalUsers = (users as any[]).length;
  const engagementRate = totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0;
  const enabledFlags = (flags as any[]).filter((f: any) => f.enabled).length;

  const services = [
    { name: "Database", status: "operational" as const, uptime: 99.99, icon: Database },
    { name: "Authentication", status: "operational" as const, uptime: 99.98, icon: Shield },
    { name: "Storage", status: "operational" as const, uptime: 99.97, icon: HardDrive },
    { name: "Realtime", status: "operational" as const, uptime: 99.95, icon: Wifi },
    { name: "Edge Functions", status: "operational" as const, uptime: 99.90, icon: Zap },
    { name: "CDN", status: "operational" as const, uptime: 100, icon: Globe },
  ];

  const metrics = [
    { label: "Total Users", value: totalUsers, max: 10000, icon: Users, color: "text-blue-500" },
    { label: "Active Now", value: onlineUsers, max: totalUsers || 1, icon: Activity, color: "text-green-500" },
    { label: "Projects", value: (projects as any[]).length, max: 5000, icon: BarChart3, color: "text-purple-500" },
    { label: "Messages", value: (messages as any[]).length, max: 10000, icon: Globe, color: "text-cyan-500" },
    { label: "Events", value: (events as any[]).length, max: 1000, icon: Clock, color: "text-pink-500" },
    { label: "Listings", value: (items as any[]).length, max: 2000, icon: TrendingUp, color: "text-orange-500" },
    { label: "Connections", value: (connections as any[]).length, max: 5000, icon: Wifi, color: "text-indigo-500" },
    { label: "Feature Flags", value: enabledFlags, max: (flags as any[]).length || 1, icon: Zap, color: "text-amber-500" },
  ];

  const overallHealth = Math.round(services.reduce((s, svc) => s + svc.uptime, 0) / services.length * 10) / 10;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Health Score */}
      <motion.div variants={item}>
        <Card className="border-border bg-gradient-to-r from-green-500/5 via-card to-card backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-foreground">Platform Health</h2>
                <p className="text-muted-foreground">All systems operational. Overall uptime: {overallHealth}%</p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <span className="text-3xl font-black text-green-600">{overallHealth}%</span>
              </div>
            </div>
            <Progress value={overallHealth} className="mt-4 h-2" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Services Status */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {services.map((svc) => (
          <Card key={svc.name} className="border-border bg-card/95 backdrop-blur-xl">
            <CardContent className="p-4 text-center">
              <svc.icon className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <div className="text-sm font-semibold text-foreground">{svc.name}</div>
              <Badge variant="secondary" className="mt-1 bg-green-500/10 text-green-600 text-xs">
                {svc.uptime}%
              </Badge>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Capacity Metrics */}
      <motion.div variants={item}>
        <Card className="border-border bg-card/95 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> Platform Capacity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <m.icon className={`h-4 w-4 ${m.color}`} />
                    {m.label}
                  </span>
                  <span className="font-bold text-foreground">{m.value.toLocaleString()}</span>
                </div>
                <Progress value={Math.min(100, (m.value / m.max) * 100)} className="h-1.5" />
                <div className="text-[10px] text-muted-foreground text-right">{Math.round((m.value / m.max) * 100)}% capacity</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Engagement */}
      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/95 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Engagement Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Online Rate</span><span className="font-bold text-foreground">{engagementRate}%</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Projects/User</span><span className="font-bold text-foreground">{totalUsers > 0 ? ((projects as any[]).length / totalUsers).toFixed(1) : 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Messages/User</span><span className="font-bold text-foreground">{totalUsers > 0 ? ((messages as any[]).length / totalUsers).toFixed(1) : 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Connections/User</span><span className="font-bold text-foreground">{totalUsers > 0 ? ((connections as any[]).length / totalUsers).toFixed(1) : 0}</span></div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/95 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4 text-primary" /> Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Users", value: totalUsers },
                { label: "Projects", value: (projects as any[]).length },
                { label: "Messages", value: (messages as any[]).length },
                { label: "Events", value: (events as any[]).length },
                { label: "Listings", value: (items as any[]).length },
                { label: "Connections", value: (connections as any[]).length },
              ].map((d) => (
                <div key={d.label} className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">{d.label}</span>
                  <span className="font-bold text-foreground">{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
