import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAdminProfiles } from "@/lib/admin-profiles";
import { Shield, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

export default function AdminSecurityPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminDb = supabase as any;

  const { data: flags = [] } = useQuery({
    queryKey: ["admin", "security-flags"],
    queryFn: async () => (await adminDb.from("admin_feature_flags").select("*").order("section", { ascending: true }).order("flag_key", { ascending: true })).data ?? [],
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ["admin", "security-impersonation"],
    queryFn: async () => (await adminDb.from("admin_impersonation_sessions").select("*").order("started_at", { ascending: false }).limit(50)).data ?? [],
  });
  const { data: users = [] } = useQuery({
    queryKey: ["admin", "security-users"],
    queryFn: fetchAdminProfiles,
  });

  const roleSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const profile of users as any[]) {
      const role = profile.user_roles?.[0]?.role || "user";
      counts.set(role, (counts.get(role) || 0) + 1);
    }
    return Array.from(counts.entries());
  }, [users]);

  const toggleFlag = async (id: string, enabled: boolean, key: string) => {
    const { error } = await adminDb.from("admin_feature_flags").update({ enabled, updated_by: user?.id }).eq("id", id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "security-flags"] });
    toast.success(`${key} ${enabled ? "enabled" : "disabled"}`);
  };

  const emitMfaReminder = async () => {
    await adminDb.from("admin_monitoring_events").insert([
      {
        event_type: "security_notice",
        severity: "info",
        source: "admin",
        message: "MFA reminder broadcast queued",
        metadata: { reminder: "mfa" },
      },
    ]);
    toast.success("MFA reminder queued");
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-cyan-300" />
            Security and permissions
          </CardTitle>
          <CardDescription className="text-slate-300">Least privilege controls, MFA nudges, and release flags live here.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {roleSummary.map(([role, count]) => (
            <div key={role} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{role}</div>
              <div className="mt-2 text-3xl font-black text-white">{count}</div>
            </div>
          ))}
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Sessions</div>
            <div className="mt-2 text-3xl font-black text-white">{(sessions as any[]).filter((session) => session.is_active).length}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Feature flags</CardTitle>
          <CardDescription className="text-slate-300">Toggle gradual rollouts per section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(flags as any[]).map((flag) => (
            <div key={flag.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-white">{flag.label}</div>
                  <div className="text-sm text-slate-300">{flag.description}</div>
                  <Badge className="mt-2 border-white/10 bg-white/10 text-white">{flag.section}</Badge>
                </div>
                <Switch checked={!!flag.enabled} onCheckedChange={(checked) => toggleFlag(flag.id, checked, flag.flag_key)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Impersonation sessions</CardTitle>
            <CardDescription className="text-slate-300">Track who is previewing what.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-300">Target</TableHead>
                  <TableHead className="text-slate-300">Active</TableHead>
                  <TableHead className="text-slate-300">Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sessions as any[]).map((session) => (
                  <TableRow key={session.id} className="border-white/10">
                    <TableCell className="text-white">{session.target_user_id}</TableCell>
                    <TableCell><Badge className="border-white/10 bg-white/10 text-white">{session.is_active ? "yes" : "no"}</Badge></TableCell>
                    <TableCell className="text-slate-400">{new Date(session.started_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!sessions.length && (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={3} className="py-8 text-center text-slate-400">No impersonation sessions yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Admin roster</CardTitle>
            <CardDescription className="text-slate-300">A quick role-and-status snapshot.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-300">User</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users as any[]).slice(0, 12).map((profile) => (
                  <TableRow key={profile.user_id} className="border-white/10">
                    <TableCell className="text-white">{profile.display_name || profile.username || profile.user_id}</TableCell>
                    <TableCell><Badge className="border-white/10 bg-white/10 text-white">{profile.user_roles?.[0]?.role || "user"}</Badge></TableCell>
                    <TableCell className="text-slate-300">{profile.status || "active"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={emitMfaReminder}>
        <LockKeyhole className="h-4 w-4" />
        MFA reminder
      </Button>
    </div>
  );
}
