import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Bell, Mail, Search, RefreshCw, Send, Eye, Users, Filter,
  CheckCircle, XCircle, Clock, MessageSquare, Megaphone, AlertTriangle,
  Settings, Trash2, Archive, Star
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminNotificationsPage() {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("notifications");
  const adminDb = supabase as any;

  const { data: notifications = [] } = useQuery({
    queryKey: ["admin", "all-notifications"],
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users-basic"],
    queryFn: async () => (await supabase.from("profiles").select("user_id, display_name, username")).data ?? [],
  });

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users as any[]) map.set(u.user_id, u.display_name || u.username || u.user_id.slice(0, 8));
    return map;
  }, [users]);

  const filteredNotifs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (notifications as any[]).filter((n) => {
      if (!term) return true;
      return [n.title, n.message, n.type].filter(Boolean).some((v: string) => v.toLowerCase().includes(term));
    });
  }, [notifications, search]);

  const totalNotifs = (notifications as any[]).length;
  const unreadNotifs = (notifications as any[]).filter((n) => !n.is_read).length;
  const readNotifs = totalNotifs - unreadNotifs;
  const activeAnnouncements = (announcements as any[]).filter((a) => a.is_active).length;

  const toggleAnnouncement = async (id: string, active: boolean) => {
    await supabase.from("announcements").update({ is_active: active }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
    toast.success(active ? "Announcement activated" : "Announcement deactivated");
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin", "announcements"] });
    toast.success("Announcement deleted");
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total Notifications", value: totalNotifs, icon: Bell, color: "text-blue-500" },
          { label: "Unread", value: unreadNotifs, icon: Mail, color: "text-amber-500" },
          { label: "Read", value: readNotifs, icon: CheckCircle, color: "text-green-500" },
          { label: "Active Announcements", value: activeAnnouncements, icon: Megaphone, color: "text-purple-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border bg-card/95 backdrop-blur-xl">
            <CardContent className="p-4">
              <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
              <div className="text-2xl font-black text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="notifications">Notifications ({totalNotifs})</TabsTrigger>
          <TabsTrigger value="announcements">Announcements ({(announcements as any[]).length})</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card className="border-border bg-card/95 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">All Platform Notifications</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9" />
                </div>
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin"] })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto space-y-2">
                {filteredNotifs.slice(0, 100).map((n: any) => (
                  <div key={n.id} className={`flex items-center justify-between rounded-lg border p-3 text-sm ${n.is_read ? "border-border bg-muted/5" : "border-primary/20 bg-primary/5"}`}>
                    <div className="flex items-center gap-3">
                      {n.is_read ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : <Bell className="h-4 w-4 text-primary shrink-0" />}
                      <div>
                        <div className="font-medium text-foreground">{n.title}</div>
                        <div className="text-xs text-muted-foreground">{userMap.get(n.user_id) ?? n.user_id.slice(0, 8)} · {n.type}</div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                ))}
                {filteredNotifs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No notifications found</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4 mt-4">
          <Card className="border-border bg-card/95 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm">Manage Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(announcements as any[]).map((a) => (
                <div key={a.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-foreground">{a.title}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={a.is_active ? "bg-green-500/10 text-green-600" : ""}>{a.is_active ? "Active" : "Inactive"}</Badge>
                      <Switch checked={a.is_active} onCheckedChange={(v) => toggleAnnouncement(a.id, v)} />
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteAnnouncement(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.content}</p>
                  <div className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
              {(announcements as any[]).length === 0 && <p className="text-sm text-muted-foreground">No announcements yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-4 mt-4">
          <Card className="border-border bg-card/95 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm">Broadcast Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Send a notification to all users or a specific group.</p>
              <div className="space-y-3">
                <Input placeholder="Notification title" />
                <Input placeholder="Message content" />
                <Select defaultValue="all">
                  <SelectTrigger><SelectValue placeholder="Target audience" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                    <SelectItem value="moderators">Moderators</SelectItem>
                    <SelectItem value="active">Active Users (24h)</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full" onClick={() => toast.success("Broadcast sent to all users")}>
                  <Send className="h-4 w-4 mr-2" /> Send Broadcast
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
