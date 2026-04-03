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
import { ArrowRightLeft, Search, UserCog } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const { user: authUser, startImpersonation, setAdminViewMode, readOnlyPreview } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const adminDb = supabase as any;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users-table"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, user_roles(role)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["admin", "users-sessions"],
    queryFn: async () => (await supabase.from("call_sessions").select("*").order("created_at", { ascending: false }).limit(25)).data ?? [],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["admin", "users-projects"],
    queryFn: async () => (await supabase.from("projects").select("id, title, user_id, created_at").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["admin", "users-notifications"],
    queryFn: async () => (await supabase.from("notifications").select("id, user_id, is_read, created_at").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sessionMap = new Map<string, number>();
    for (const session of sessions as any[]) {
      const actor = session.user_id || session.created_by || session.participant_id || "unknown";
      sessionMap.set(actor, (sessionMap.get(actor) || 0) + 1);
    }
    const projectMap = new Map<string, number>();
    for (const project of projects as any[]) {
      projectMap.set(project.user_id, (projectMap.get(project.user_id) || 0) + 1);
    }
    const unreadMap = new Map<string, number>();
    for (const note of notifications as any[]) {
      if (!note.is_read) unreadMap.set(note.user_id, (unreadMap.get(note.user_id) || 0) + 1);
    }

    return (users as any[]).filter((profile) => {
      if (!term) return true;
      return [profile.display_name, profile.username, profile.bio, profile.status, profile.user_roles?.[0]?.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    }).map((profile) => ({
      ...profile,
      sessionCount: sessionMap.get(profile.user_id) ?? 0,
      projectCount: projectMap.get(profile.user_id) ?? 0,
      unreadCount: unreadMap.get(profile.user_id) ?? 0,
    }));
  }, [users, sessions, projects, notifications, search]);

  const updateRole = async (userId: string, role: "admin" | "moderator" | "user") => {
    if (readOnlyPreview) return toast.info("Preview mode is read only");
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert([{ user_id: userId, role }]);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "users-table"] });
    toast.success("Role updated");
    void adminDb.from("admin_audit_logs").insert([{ actor_id: authUser?.id, actor_role: "admin", action: "update_user_role", entity_type: "user", entity_id: userId, details: { role } }]);
  };

  const updateStatus = async (userId: string, status: string) => {
    if (readOnlyPreview) return toast.info("Preview mode is read only");
    const { error } = await adminDb.from("profiles").update({ status }).eq("user_id", userId);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "users-table"] });
    toast.success("Status updated");
    void adminDb.from("admin_audit_logs").insert([{ actor_id: authUser?.id, actor_role: "admin", action: "update_user_status", entity_type: "user", entity_id: userId, details: { status } }]);
  };

  const impersonateUser = (profile: any) => {
    if (readOnlyPreview) return toast.info("Preview mode is read only");
    startImpersonation({ userId: profile.user_id, label: profile.display_name || profile.username || profile.user_id });
    setAdminViewMode("user");
    navigate("/dashboard");
    void adminDb.from("admin_audit_logs").insert([{
      actor_id: authUser?.id,
      actor_role: "admin",
      action: "start_impersonation",
      entity_type: "user",
      entity_id: profile.user_id,
      details: { label: profile.display_name || profile.username || profile.user_id },
    }]);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <UserCog className="h-5 w-5 text-primary" />
              User management
            </CardTitle>
            <CardDescription className="text-muted-foreground">Manage roles, status, session visibility, and impersonation from one table.</CardDescription>
            {readOnlyPreview && <Badge className="mt-2 border-border bg-secondary text-foreground">Read-only preview</Badge>}
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="border-border bg-background pl-9" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <MiniStat label="Profiles" value={users.length} />
          <MiniStat label="Visible" value={rows.length} />
          <MiniStat label="Projects" value={(projects as any[]).length} />
          <MiniStat label="Unread" value={(notifications as any[]).filter((note) => !note.is_read).length} />
        </CardContent>
      </Card>

      <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-foreground">Live user table</CardTitle>
          <CardDescription className="text-muted-foreground">Backed by profiles, roles, projects, notifications, and sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Projects</TableHead>
                <TableHead className="text-muted-foreground">Sessions</TableHead>
                <TableHead className="text-muted-foreground">Unread</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow className="border-border">
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Loading users...</TableCell>
                </TableRow>
              )}
              {rows.map((profile: any) => (
                <TableRow key={profile.user_id} className="border-border">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">{profile.display_name || profile.username || profile.user_id}</div>
                      <div className="text-xs text-muted-foreground">{profile.username ? `@${profile.username}` : profile.user_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={profile.user_roles?.[0]?.role || "user"} onValueChange={(value) => updateRole(profile.user_id, value as "admin" | "moderator" | "user")} disabled={readOnlyPreview}>
                      <SelectTrigger className="w-36 border-border bg-background" disabled={readOnlyPreview}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={profile.status || "active"} onValueChange={(value) => updateStatus(profile.user_id, value)} disabled={readOnlyPreview}>
                      <SelectTrigger className="w-32 border-border bg-background" disabled={readOnlyPreview}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-foreground">{profile.projectCount}</TableCell>
                  <TableCell className="text-foreground">{profile.sessionCount}</TableCell>
                  <TableCell className="text-foreground">{profile.unreadCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="border-border bg-background hover:bg-secondary" onClick={() => navigate(`/profile/${profile.user_id}`)}>
                        Open profile
                      </Button>
                      <Button variant="outline" size="sm" className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/15" onClick={() => impersonateUser(profile)} disabled={readOnlyPreview}>
                        <ArrowRightLeft className="h-4 w-4" />
                        Impersonate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow className="border-border">
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No users match your search.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-border bg-background p-4">
      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-black text-foreground">{value}</div>
    </div>
  );
}
