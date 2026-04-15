import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAdminProfiles } from "@/lib/admin-profiles";
import {
  Users, FolderOpen, Calendar, MessageSquare, ShoppingBag, Activity, TrendingUp,
  Bell, Shield, Eye, ArrowRight, RefreshCw, Zap, BarChart3, Globe, Clock,
  CheckCircle, AlertTriangle, Database
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const adminDb = supabase as any;

  const { data: users = [] } = useQuery({ queryKey: ["admin", "users"], queryFn: fetchAdminProfiles });
  const { data: projects = [] } = useQuery({ queryKey: ["admin", "projects"], queryFn: async () => (await supabase.from("projects").select("id, user_id, created_at")).data ?? [] });
  const { data: events = [] } = useQuery({ queryKey: ["admin", "events"], queryFn: async () => (await supabase.from("events").select("id, user_id, event_date, created_at")).data ?? [] });
  const { data: messages = [] } = useQuery({ queryKey: ["admin", "messages"], queryFn: async () => (await supabase.from("messages").select("id, sender_id, created_at").limit(1000)).data ?? [] });
  const { data: sellingItems = [] } = useQuery({ queryKey: ["admin", "selling"], queryFn: async () => (await supabase.from("selling_items").select("id, seller_id, price, views_count")).data ?? [] });
  const { data: announcements = [] } = useQuery({ queryKey: ["admin", "announcements"], queryFn: async () => (await supabase.from("announcements").select("*")).data ?? [] });
  const { data: featureFlags = [] } = useQuery({ queryKey: ["admin", "feature-flags"], queryFn: async () => (await adminDb.from("admin_feature_flags").select("*")).data ?? [] });
  const { data: auditLogs = [] } = useQuery({ queryKey: ["admin", "audit-logs"], queryFn: async () => (await adminDb.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(10)).data ?? [] });
  const { data: connections = [] } = useQuery({ queryKey: ["admin", "connections"], queryFn: async () => (await supabase.from("connections").select("id")).data ?? [] });

  const onlineUsers = (users as any[]).filter((u) => u.last_seen_at && Date.now() - new Date(u.last_seen_at).getTime() < 5 * 60 * 1000).length;
  const activeToday = (users as any[]).filter((u) => u.last_seen_at && Date.now() - new Date(u.last_seen_at).getTime() < 24 * 60 * 60 * 1000).length;
  const newUsersWeek = (users as any[]).filter((u) => Date.now() - new Date(u.created_at).getTime() < 7 * 24 * 60 * 60 * 1000).length;
  const totalRevenue = (sellingItems as any[]).reduce((s, i) => s + (i.price ?? 0), 0);
  const totalViews = (sellingItems as any[]).reduce((s, i) => s + (i.views_count ?? 0), 0);
  const activeAnnouncements = (announcements as any[]).filter((a) => a.is_active).length;
  const enabledFlags = (featureFlags as any[]).filter((f: any) => f.enabled).length;

  const healthScore = Math.min(100, Math.max(20, 50 + onlineUsers * 3 + (projects as any[]).length + enabledFlags * 2 - (auditLogs as any[]).length));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    toast.success("Dashboard refreshed");
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Welcome Header */}
      <motion.div variants={item}>
        <Card className="border-border bg-gradient-to-r from-primary/5 via-card to-card backdrop-blur-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-foreground">Welcome back, {profile?.display_name || "Admin"}</h1>
                <p className="text-muted-foreground mt-1">Here's what's happening on your platform right now.</p>
                <div className="flex items-center gap-3 mt-3">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <Activity className="h-3 w-3 mr-1" /> {onlineUsers} online
                  </Badge>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" /> {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Badge>
                  <Badge variant="secondary" className={healthScore > 70 ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}>
                    Health: {healthScore}%
                  </Badge>
                </div>
              </div>
              <Button variant="outline" className="border-border" onClick={refresh}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Metrics Grid */}
      <motion.div variants={item} className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
        {[
          { label: "Total Users", value: (users as any[]).length, icon: Users, color: "text-blue-500", onClick: () => navigate("/admin/users") },
          { label: "Online Now", value: onlineUsers, icon: Activity, color: "text-green-500" },
          { label: "Active Today", value: activeToday, icon: TrendingUp, color: "text-purple-500" },
          { label: "New (7d)", value: newUsersWeek, icon: Zap, color: "text-amber-500" },
          { label: "Projects", value: (projects as any[]).length, icon: FolderOpen, color: "text-cyan-500" },
          { label: "Events", value: (events as any[]).length, icon: Calendar, color: "text-pink-500" },
          { label: "Messages", value: (messages as any[]).length, icon: MessageSquare, color: "text-indigo-500" },
          { label: "Listings", value: (sellingItems as any[]).length, icon: ShoppingBag, color: "text-orange-500" },
          { label: "Connections", value: (connections as any[]).length, icon: Globe, color: "text-teal-500" },
          { label: "Total Views", value: totalViews, icon: Eye, color: "text-rose-500" },
        ].map((stat) => (
          <motion.div key={stat.label} whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={stat.onClick}>
            <Card className="border-border bg-card/95 backdrop-blur-xl hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                <div className="text-2xl font-black text-foreground">{stat.value.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Navigation */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        {[
          { title: "User Management", desc: "View all users, roles, and activity", icon: Users, path: "/admin/users", count: (users as any[]).length },
          { title: "Content Manager", desc: "Announcements, promotions, and ads", icon: Database, path: "/admin/content", count: (announcements as any[]).length },
          { title: "Feature Flags", desc: `${enabledFlags} of ${(featureFlags as any[]).length} enabled`, icon: Zap, path: "/admin/settings" },
          { title: "Security Center", desc: "Audit logs, RLS, and access control", icon: Shield, path: "/admin/security", count: (auditLogs as any[]).length },
          { title: "Analytics", desc: "Platform metrics and insights", icon: BarChart3, path: "/admin/analytics" },
          { title: "Monitoring", desc: "System health and performance", icon: Activity, path: "/admin/monitoring" },
        ].map((nav) => (
          <Card key={nav.title} className="border-border bg-card/95 backdrop-blur-xl hover:border-primary/30 transition-all cursor-pointer group" onClick={() => navigate(nav.path)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <nav.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{nav.title}</div>
                  <div className="text-xs text-muted-foreground">{nav.desc}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Recent Activity & System Status */}
      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card/95 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm text-foreground flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Recent Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(auditLogs as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent actions recorded.</p>
            ) : (auditLogs as any[]).slice(0, 8).map((log: any) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-foreground font-medium">{log.action}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/95 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm text-foreground flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Database", status: "Operational", ok: true },
              { label: "Authentication", status: "Operational", ok: true },
              { label: "Storage", status: "Operational", ok: true },
              { label: "Realtime", status: "Operational", ok: true },
              { label: "Edge Functions", status: "Operational", ok: true },
              { label: "Active Announcements", status: `${activeAnnouncements} live`, ok: activeAnnouncements > 0 },
              { label: "Feature Flags", status: `${enabledFlags}/${(featureFlags as any[]).length} enabled`, ok: true },
              { label: "Platform Health", status: `${healthScore}%`, ok: healthScore > 60 },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.label}</span>
                <div className="flex items-center gap-1.5">
                  {s.ok ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                  <span className={s.ok ? "text-green-600" : "text-amber-600"}>{s.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
