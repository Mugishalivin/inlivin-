import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRightLeft, Search, Shield, SquareUserRound } from "lucide-react";
import { toast } from "sonner";

export function ImpersonationPanel() {
  const { user: authUser, impersonationTarget, startImpersonation, stopImpersonation, setAdminViewMode, readOnlyPreview } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const adminDb = supabase as any;

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin", "impersonation-users"],
    queryFn: async () => (await supabase.from("profiles").select("*, user_roles(role)").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ["admin", "impersonation-sessions"],
    queryFn: async () => (await adminDb.from("admin_impersonation_sessions").select("*").order("started_at", { ascending: false }).limit(25)).data ?? [],
  });

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (profiles as any[]).filter((profile) =>
      [profile.display_name, profile.username, profile.bio, profile.status, profile.user_roles?.[0]?.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [profiles, search]);

  const enterPreview = (profile: any) => {
    if (readOnlyPreview) return toast.info("Preview mode is already active");
    startImpersonation({ userId: profile.user_id, label: profile.display_name || profile.username || profile.user_id });
    setAdminViewMode("user");
    navigate("/dashboard");
    void adminDb.from("admin_audit_logs").insert([{
      actor_id: authUser?.id,
      actor_role: "admin",
      action: "start_impersonation",
      entity_type: "user",
      entity_id: profile.user_id,
      details: { label: profile.display_name || profile.username || profile.user_id, source: "impersonation_tab" },
    }]);
  };

  const exitPreview = async () => {
    stopImpersonation();
    setAdminViewMode("admin");
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
    toast.success("Preview ended");
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Impersonate
            </CardTitle>
            <CardDescription className="text-muted-foreground">Enter a user account in read-only preview mode and inspect the app exactly as they see it.</CardDescription>
            {readOnlyPreview && impersonationTarget && (
              <Badge className="mt-2 border-border bg-secondary text-foreground">
                Previewing as {impersonationTarget.label}
              </Badge>
            )}
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="border-border bg-background pl-9" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <MiniStat label="Profiles" value={profiles.length} />
          <MiniStat label="Visible" value={filteredProfiles.length} />
          <MiniStat label="Active previews" value={(sessions as any[]).filter((session) => session.is_active).length} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-foreground">Choose a user</CardTitle>
            <CardDescription className="text-muted-foreground">Open a read-only preview from any user account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredProfiles.map((profile: any) => (
              <div key={profile.user_id} className="rounded-3xl border border-border bg-background p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.display_name || profile.username} className="h-full w-full object-cover" />
                      ) : (
                        <SquareUserRound className="h-5 w-5 text-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">{profile.display_name || profile.username || profile.user_id}</div>
                      <div className="text-sm text-muted-foreground">{profile.bio || "No bio available."}</div>
                      <div className="text-xs text-muted-foreground">{profile.username ? `@${profile.username}` : profile.user_id}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-border bg-secondary text-foreground">{profile.user_roles?.[0]?.role || "user"}</Badge>
                    <Badge className="border-border bg-secondary text-foreground">{profile.status || "active"}</Badge>
                    <Button variant="outline" size="sm" className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/15" onClick={() => enterPreview(profile)} disabled={readOnlyPreview}>
                      <Shield className="h-4 w-4" />
                      Enter preview
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-foreground">Active preview sessions</CardTitle>
            <CardDescription className="text-muted-foreground">Database-backed impersonation history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {impersonationTarget ? (
              <div className="rounded-3xl border border-primary/20 bg-primary/10 p-4">
                <div className="font-semibold text-foreground">Current preview</div>
                <div className="mt-1 text-sm text-muted-foreground">{impersonationTarget.label}</div>
                <Button variant="outline" className="mt-4 border-border bg-background hover:bg-secondary" onClick={exitPreview}>
                  Exit preview
                </Button>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                No active preview right now.
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Target</TableHead>
                  <TableHead className="text-muted-foreground">Active</TableHead>
                  <TableHead className="text-muted-foreground">Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sessions as any[]).slice(0, 8).map((session) => (
                  <TableRow key={session.id} className="border-border">
                    <TableCell className="text-foreground">{session.target_user_id}</TableCell>
                    <TableCell className="text-foreground">{session.is_active ? "yes" : "no"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(session.started_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
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
