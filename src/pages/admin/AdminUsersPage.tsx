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
import { fetchAdminProfiles } from "@/lib/admin-profiles";
import { ArrowRightLeft, Search, UserCog } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const { user: authUser, startImpersonation, setAdminViewMode, readOnlyPreview } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const adminDb = supabase as any;

  const { data: users = [], isLoading, error: usersError } = useQuery({
    queryKey: ["admin", "users-table"],
    queryFn: fetchAdminProfiles,
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

    const filtered = (users as any[]).filter((profile) => {
      if (!term) return true;
      return [profile.display_name, profile.username, profile.bio, profile.location, profile.website, profile.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    }).map((profile) => ({
      ...profile,
      sessionCount: sessionMap.get(profile.user_id) ?? 0,
      projectCount: projectMap.get(profile.user_id) ?? 0,
      unreadCount: unreadMap.get(profile.user_id) ?? 0,
    }));
    return filtered;
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
              Profiles / Users / Accounts
            </CardTitle>
            <CardDescription className="text-muted-foreground">All rows from `profiles` are loaded here as the live account registry, with connected roles, sessions, and impersonation.</CardDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="border-border bg-secondary text-foreground">Profile</Badge>
              <Badge className="border-border bg-secondary text-foreground">User</Badge>
              <Badge className="border-border bg-secondary text-foreground">Account</Badge>
            </div>
            {readOnlyPreview && <Badge className="mt-2 border-border bg-secondary text-foreground">Read-only preview</Badge>}
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search profiles by name, username, bio, or role..." className="border-border bg-background pl-9" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <MiniStat label="Profiles" value={users.length} />
          <MiniStat label="Visible" value={rows.length} />
          <MiniStat label="Projects" value={(projects as any[]).length} />
          <MiniStat label="Unread" value={(notifications as any[]).filter((note) => !note.is_read).length} />
        </CardContent>
        {usersError && (
          <CardContent className="pt-0">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              Profiles could not be loaded from the database. Refresh the Supabase schema cache and confirm the `profiles` access migration is applied.
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-foreground">Live account registry</CardTitle>
          <CardDescription className="text-muted-foreground">Every displayed row comes directly from `profiles` and stays in sync with roles, projects, notifications, and sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-muted-foreground">Last seen</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Projects</TableHead>
                <TableHead className="text-muted-foreground">Sessions</TableHead>
                <TableHead className="text-muted-foreground">Unread</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow className="border-border">
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Loading profiles from the database...</TableCell>
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
                  <TableCell className="text-foreground">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "n/a"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {profile.last_seen_at ? new Date(profile.last_seen_at).toLocaleString() : "n/a"}
                  </TableCell>
                  <TableCell>
                    <Select value={profile.role || "user"} onValueChange={(value) => updateRole(profile.user_id, value as "admin" | "moderator" | "user")} disabled={readOnlyPreview}>
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
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    {search.trim() ? "No profiles match your search." : "No profiles are available in the database yet."}
                  </TableCell>
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
