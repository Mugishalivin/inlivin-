import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { fetchAdminProfiles, type AdminProfileRow } from "@/lib/admin-profiles";
import {
  ArrowRightLeft, Search, UserCog, Shield, Mail, MapPin, Globe, Calendar,
  Clock, Activity, MessageSquare, FolderOpen, Eye, Ban, Download, RefreshCw,
  ChevronRight, Users, Star, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  BarChart3, Bell, Hash, Smartphone, Filter, SortAsc, SortDesc, UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type SortField = "name" | "joined" | "last_seen" | "role" | "projects";
type SortDir = "asc" | "desc";
type FilterRole = "all" | "admin" | "moderator" | "user";
type FilterStatus = "all" | "online" | "offline" | "new";

function isOnline(lastSeen: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function isRecentlyActive(lastSeen: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 24 * 60 * 60 * 1000;
}

function timeAgo(date: string | null) {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function AdminUsersPage() {
  const { user: authUser, startImpersonation, setAdminViewMode, readOnlyPreview } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("last_seen");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const adminDb = supabase as any;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users-table"],
    queryFn: fetchAdminProfiles,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["admin", "users-projects"],
    queryFn: async () => (await supabase.from("projects").select("id, title, user_id, created_at, status").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["admin", "users-notifications"],
    queryFn: async () => (await supabase.from("notifications").select("id, user_id, is_read, created_at, title, type").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  const { data: connections = [] } = useQuery({
    queryKey: ["admin", "users-connections"],
    queryFn: async () => (await supabase.from("connections").select("*")).data ?? [],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["admin", "users-messages-count"],
    queryFn: async () => (await supabase.from("messages").select("id, sender_id, created_at").order("created_at", { ascending: false }).limit(1000)).data ?? [],
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin", "users-events"],
    queryFn: async () => (await supabase.from("events").select("id, user_id, title, event_date").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: sellingItems = [] } = useQuery({
    queryKey: ["admin", "users-selling"],
    queryFn: async () => (await supabase.from("selling_items").select("id, seller_id, title, price, views_count, likes_count").order("created_at", { ascending: false })).data ?? [],
  });

  // Build enriched user rows
  const enrichedRows = useMemo(() => {
    const projectMap = new Map<string, any[]>();
    for (const p of projects as any[]) {
      const arr = projectMap.get(p.user_id) ?? [];
      arr.push(p);
      projectMap.set(p.user_id, arr);
    }
    const followerMap = new Map<string, number>();
    const followingMap = new Map<string, number>();
    for (const c of connections as any[]) {
      followerMap.set(c.following_id, (followerMap.get(c.following_id) ?? 0) + 1);
      followingMap.set(c.follower_id, (followingMap.get(c.follower_id) ?? 0) + 1);
    }
    const msgMap = new Map<string, number>();
    for (const m of messages as any[]) {
      msgMap.set(m.sender_id, (msgMap.get(m.sender_id) ?? 0) + 1);
    }
    const unreadMap = new Map<string, number>();
    for (const n of notifications as any[]) {
      if (!n.is_read) unreadMap.set(n.user_id, (unreadMap.get(n.user_id) ?? 0) + 1);
    }
    const eventMap = new Map<string, number>();
    for (const e of events as any[]) {
      eventMap.set(e.user_id, (eventMap.get(e.user_id) ?? 0) + 1);
    }
    const listingMap = new Map<string, any[]>();
    for (const s of sellingItems as any[]) {
      const arr = listingMap.get(s.seller_id) ?? [];
      arr.push(s);
      listingMap.set(s.seller_id, arr);
    }

    return (users as any[]).map((profile) => ({
      ...profile,
      projects: projectMap.get(profile.user_id) ?? [],
      projectCount: (projectMap.get(profile.user_id) ?? []).length,
      followers: followerMap.get(profile.user_id) ?? 0,
      following: followingMap.get(profile.user_id) ?? 0,
      messagesSent: msgMap.get(profile.user_id) ?? 0,
      unreadNotifs: unreadMap.get(profile.user_id) ?? 0,
      eventsCreated: eventMap.get(profile.user_id) ?? 0,
      listings: listingMap.get(profile.user_id) ?? [],
      listingCount: (listingMap.get(profile.user_id) ?? []).length,
      online: isOnline(profile.last_seen_at),
      recentlyActive: isRecentlyActive(profile.last_seen_at),
    }));
  }, [users, projects, connections, messages, notifications, events, sellingItems]);

  // Filter
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enrichedRows.filter((u) => {
      if (term && ![u.display_name, u.username, u.bio, u.location, u.user_id].filter(Boolean).some((v: string) => v.toLowerCase().includes(term))) return false;
      if (filterRole !== "all" && u.role !== filterRole) return false;
      if (filterStatus === "online" && !u.online) return false;
      if (filterStatus === "offline" && u.online) return false;
      if (filterStatus === "new") {
        const joined = new Date(u.created_at).getTime();
        if (Date.now() - joined > 7 * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [enrichedRows, search, filterRole, filterStatus]);

  // Sort
  const rows = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = (a.display_name ?? "").localeCompare(b.display_name ?? ""); break;
        case "joined": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        case "last_seen": cmp = (new Date(a.last_seen_at ?? 0).getTime()) - (new Date(b.last_seen_at ?? 0).getTime()); break;
        case "role": cmp = (a.role ?? "").localeCompare(b.role ?? ""); break;
        case "projects": cmp = a.projectCount - b.projectCount; break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [filtered, sortField, sortDir]);

  // Stats
  const totalUsers = enrichedRows.length;
  const onlineCount = enrichedRows.filter((u) => u.online).length;
  const activeToday = enrichedRows.filter((u) => u.recentlyActive).length;
  const newThisWeek = enrichedRows.filter((u) => Date.now() - new Date(u.created_at).getTime() < 7 * 24 * 60 * 60 * 1000).length;
  const adminCount = enrichedRows.filter((u) => u.role === "admin").length;
  const modCount = enrichedRows.filter((u) => u.role === "moderator").length;

  const updateRole = async (userId: string, role: "admin" | "moderator" | "user") => {
    if (readOnlyPreview) return toast.info("Preview mode is read only");
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert([{ user_id: userId, role }]);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    toast.success("Role updated");
  };

  const impersonateUser = (profile: any) => {
    if (readOnlyPreview) return toast.info("Preview mode is read only");
    startImpersonation({ userId: profile.user_id, label: profile.display_name || profile.username || profile.user_id });
    setAdminViewMode("user");
    navigate("/dashboard");
  };

  const openUserDetail = (profile: any) => {
    setSelectedUser(profile);
    setDetailOpen(true);
    setActiveTab("overview");
  };

  const exportUsers = () => {
    const csv = [
      ["Display Name", "Username", "Email ID", "Role", "Joined", "Last Seen", "Projects", "Followers", "Messages Sent", "Location"].join(","),
      ...enrichedRows.map((u) => [
        u.display_name ?? "", u.username ?? "", u.user_id, u.role, u.created_at, u.last_seen_at ?? "Never",
        u.projectCount, u.followers, u.messagesSent, u.location ?? ""
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Users exported");
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Users", value: totalUsers, icon: Users, color: "text-primary" },
          { label: "Online Now", value: onlineCount, icon: Activity, color: "text-green-500" },
          { label: "Active Today", value: activeToday, icon: TrendingUp, color: "text-blue-500" },
          { label: "New This Week", value: newThisWeek, icon: UserPlus, color: "text-purple-500" },
          { label: "Admins", value: adminCount, icon: Shield, color: "text-amber-500" },
          { label: "Moderators", value: modCount, icon: Star, color: "text-cyan-500" },
        ].map((stat) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-border bg-card/95 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <span className="text-2xl font-black text-foreground">{stat.value}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <Card className="border-border bg-card/95 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, username, bio, location..." className="border-border bg-background pl-9" />
            </div>
            <Select value={filterRole} onValueChange={(v) => setFilterRole(v as FilterRole)}>
              <SelectTrigger className="w-32 border-border bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="moderator">Moderators</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-32 border-border bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="new">New (7d)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="border-border" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin"] })}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" className="border-border" onClick={exportUsers}>
              <Download className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <Badge variant="secondary">{rows.length} of {totalUsers}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-border bg-card/95 backdrop-blur-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground w-8">#</TableHead>
                  <TableHead className="text-muted-foreground cursor-pointer" onClick={() => toggleSort("name")}>
                    <span className="flex items-center gap-1">User <SortIcon field="name" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground cursor-pointer" onClick={() => toggleSort("joined")}>
                    <span className="flex items-center gap-1">Joined <SortIcon field="joined" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground cursor-pointer" onClick={() => toggleSort("last_seen")}>
                    <span className="flex items-center gap-1">Last Login <SortIcon field="last_seen" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground cursor-pointer" onClick={() => toggleSort("role")}>
                    <span className="flex items-center gap-1">Role <SortIcon field="role" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground cursor-pointer" onClick={() => toggleSort("projects")}>
                    <span className="flex items-center gap-1">Projects <SortIcon field="projects" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground">Social</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">Loading users...</TableCell></TableRow>
                )}
                <AnimatePresence>
                  {rows.map((profile, idx) => (
                    <motion.tr
                      key={profile.user_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => openUserDetail(profile)}
                    >
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-border">
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} className="h-full w-full object-cover" alt="" />
                              ) : (
                                <span className="text-sm font-bold text-primary">{(profile.display_name ?? profile.username ?? "U")[0]?.toUpperCase()}</span>
                              )}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${profile.online ? "bg-green-500" : profile.recentlyActive ? "bg-amber-500" : "bg-muted-foreground/30"}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{profile.display_name || profile.username || "Unnamed"}</div>
                            <div className="text-xs text-muted-foreground">{profile.username ? `@${profile.username}` : profile.user_id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${profile.online ? "bg-green-500/10 text-green-600 border-green-500/20" : profile.recentlyActive ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : ""}`}>
                          {profile.online ? "Online" : profile.recentlyActive ? "Active" : "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground text-sm">{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{timeAgo(profile.last_seen_at)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          profile.role === "admin" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                          profile.role === "moderator" ? "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" : ""
                        }>{profile.role}</Badge>
                      </TableCell>
                      <TableCell className="text-foreground text-sm">{profile.projectCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{profile.followers} followers</span>
                          <span>·</span>
                          <span>{profile.messagesSent} msgs</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openUserDetail(profile)} title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/profile/${profile.user_id}`)} title="Open profile">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary" onClick={() => impersonateUser(profile)} disabled={readOnlyPreview} title="Impersonate">
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {!rows.length && !isLoading && (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                    {search.trim() || filterRole !== "all" || filterStatus !== "all" ? "No users match your filters." : "No users found."}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-border">
                      {selectedUser.avatar_url ? (
                        <img src={selectedUser.avatar_url} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <span className="text-xl font-bold text-primary">{(selectedUser.display_name ?? "U")[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${selectedUser.online ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedUser.display_name || selectedUser.username || "Unnamed User"}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedUser.username && <span className="text-sm text-muted-foreground">@{selectedUser.username}</span>}
                      <Badge variant="secondary" className={
                        selectedUser.role === "admin" ? "bg-amber-500/10 text-amber-600" :
                        selectedUser.role === "moderator" ? "bg-cyan-500/10 text-cyan-600" : ""
                      }>{selectedUser.role}</Badge>
                      <Badge variant="secondary" className={selectedUser.online ? "bg-green-500/10 text-green-600" : ""}>
                        {selectedUser.online ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Profile Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={Hash} label="User ID" value={selectedUser.user_id} mono />
                    <InfoRow icon={Calendar} label="Joined" value={new Date(selectedUser.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
                    <InfoRow icon={Clock} label="Last Login" value={selectedUser.last_seen_at ? new Date(selectedUser.last_seen_at).toLocaleString() : "Never"} />
                    <InfoRow icon={MapPin} label="Location" value={selectedUser.location || "Not set"} />
                    <InfoRow icon={Globe} label="Website" value={selectedUser.website || "Not set"} />
                    <InfoRow icon={Mail} label="Bio" value={selectedUser.bio ? selectedUser.bio.slice(0, 80) : "No bio"} />
                  </div>

                  <Separator />

                  {/* Engagement Stats */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Projects", value: selectedUser.projectCount, icon: FolderOpen },
                      { label: "Followers", value: selectedUser.followers, icon: Users },
                      { label: "Following", value: selectedUser.following, icon: TrendingUp },
                      { label: "Messages", value: selectedUser.messagesSent, icon: MessageSquare },
                      { label: "Events", value: selectedUser.eventsCreated, icon: Calendar },
                      { label: "Listings", value: selectedUser.listingCount, icon: Star },
                      { label: "Unread Notifs", value: selectedUser.unreadNotifs, icon: Bell },
                      { label: "Activity Score", value: Math.min(100, selectedUser.projectCount * 10 + selectedUser.followers * 5 + selectedUser.messagesSent), icon: BarChart3 },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                        <s.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <div className="text-lg font-bold text-foreground">{s.value}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/profile/${selectedUser.user_id}`)}>View Profile</Button>
                    <Button size="sm" variant="outline" onClick={() => { navigate(`/messages?chatWith=${selectedUser.user_id}`); setDetailOpen(false); }}>Send Message</Button>
                    <Button size="sm" variant="outline" onClick={() => impersonateUser(selectedUser)} disabled={readOnlyPreview}>Impersonate</Button>
                    <Select value={selectedUser.role || "user"} onValueChange={(v) => { updateRole(selectedUser.user_id, v as any); setSelectedUser({ ...selectedUser, role: v }); }} disabled={readOnlyPreview}>
                      <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-4 mt-4">
                  <h3 className="text-sm font-semibold text-foreground">Login History</h3>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last seen</span>
                      <span className="text-foreground font-medium">{selectedUser.last_seen_at ? new Date(selectedUser.last_seen_at).toLocaleString() : "Never"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Account created</span>
                      <span className="text-foreground font-medium">{new Date(selectedUser.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Days since signup</span>
                      <span className="text-foreground font-medium">{Math.floor((Date.now() - new Date(selectedUser.created_at).getTime()) / 86400000)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="secondary" className={selectedUser.online ? "bg-green-500/10 text-green-600" : ""}>{selectedUser.online ? "Currently Online" : selectedUser.recentlyActive ? "Active today" : "Inactive"}</Badge>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground">Recent Notifications</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(notifications as any[]).filter((n) => n.user_id === selectedUser.user_id).slice(0, 10).map((n) => (
                      <div key={n.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Bell className="h-3 w-3 text-muted-foreground" />
                          <span className="text-foreground">{n.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                      </div>
                    ))}
                    {(notifications as any[]).filter((n) => n.user_id === selectedUser.user_id).length === 0 && (
                      <p className="text-sm text-muted-foreground">No notifications</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4 mt-4">
                  <h3 className="text-sm font-semibold text-foreground">Projects ({selectedUser.projectCount})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedUser.projects.slice(0, 10).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-3 w-3 text-muted-foreground" />
                          <span className="text-foreground">{p.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {selectedUser.projects.length === 0 && <p className="text-sm text-muted-foreground">No projects</p>}
                  </div>

                  <h3 className="text-sm font-semibold text-foreground">Marketplace Listings ({selectedUser.listingCount})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedUser.listings.slice(0, 10).map((l: any) => (
                      <div key={l.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Star className="h-3 w-3 text-muted-foreground" />
                          <span className="text-foreground">{l.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">${l.price}</span>
                      </div>
                    ))}
                    {selectedUser.listings.length === 0 && <p className="text-sm text-muted-foreground">No listings</p>}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-4">
                  <h3 className="text-sm font-semibold text-foreground">Administrative Actions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">Change Role</div>
                        <div className="text-xs text-muted-foreground">Promote or demote this user</div>
                      </div>
                      <Select value={selectedUser.role || "user"} onValueChange={(v) => { updateRole(selectedUser.user_id, v as any); setSelectedUser({ ...selectedUser, role: v }); }} disabled={readOnlyPreview}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">Impersonate User</div>
                        <div className="text-xs text-muted-foreground">View the platform as this user</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => impersonateUser(selectedUser)} disabled={readOnlyPreview}>
                        <ArrowRightLeft className="h-4 w-4 mr-1" /> Start
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">View Public Profile</div>
                        <div className="text-xs text-muted-foreground">Open their public-facing page</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/profile/${selectedUser.user_id}`)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
      </div>
    </div>
  );
}
