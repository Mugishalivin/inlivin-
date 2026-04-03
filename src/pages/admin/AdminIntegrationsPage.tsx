import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Plug, BellRing } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminIntegrationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminDb = supabase as any;

  const { data: integrations = [] } = useQuery({
    queryKey: ["admin", "integrations"],
    queryFn: async () => (await adminDb.from("admin_integrations").select("*").order("category", { ascending: true }).order("label", { ascending: true })).data ?? [],
  });
  const { data: alertRules = [] } = useQuery({
    queryKey: ["admin", "alert-rules"],
    queryFn: async () => (await adminDb.from("admin_alert_rules").select("*").order("rule_key", { ascending: true })).data ?? [],
  });

  const syncIntegration = async (id: string, label: string) => {
    const { error } = await adminDb.from("admin_integrations").update({ last_sync_at: new Date().toISOString(), updated_by: user?.id }).eq("id", id);
    if (error) return toast.error(error.message);
    await adminDb.from("admin_monitoring_events").insert([
      {
        event_type: "integration_sync",
        severity: "info",
        source: "admin",
        message: `${label} synced`,
        metadata: { integration_id: id },
      },
    ]);
    queryClient.invalidateQueries({ queryKey: ["admin", "integrations"] });
    toast.success(`${label} synced`);
  };

  const toggleAlert = async (id: string, enabled: boolean, label: string) => {
    const { error } = await adminDb.from("admin_alert_rules").update({ enabled, updated_by: user?.id }).eq("id", id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "alert-rules"] });
    toast.success(`${label} ${enabled ? "enabled" : "disabled"}`);
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Plug className="h-5 w-5 text-cyan-300" />
            Integrations
          </CardTitle>
          <CardDescription className="text-slate-300">Analytics, BI, alerts, and external hooks are managed here.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Connected systems</CardTitle>
          <CardDescription className="text-slate-300">Sync status and endpoint health for every integration.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-300">Label</TableHead>
                <TableHead className="text-slate-300">Category</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Health</TableHead>
                <TableHead className="text-slate-300">Last sync</TableHead>
                <TableHead className="text-slate-300">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(integrations as any[]).map((integration) => (
                <TableRow key={integration.id} className="border-white/10">
                  <TableCell className="text-white">{integration.label}</TableCell>
                  <TableCell className="text-slate-300">{integration.category}</TableCell>
                  <TableCell><Badge className="border-white/10 bg-white/10 text-white">{integration.status}</Badge></TableCell>
                  <TableCell className="text-slate-300">{integration.health_score}</TableCell>
                  <TableCell className="text-slate-400">{integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleString() : "Never"}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => syncIntegration(integration.id, integration.label)}>
                      <RefreshCw className="h-4 w-4" />
                      Sync now
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BellRing className="h-5 w-5 text-cyan-300" />
            Alert rules
          </CardTitle>
          <CardDescription className="text-slate-300">Thresholds for email or Slack notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(alertRules as any[]).map((rule) => (
            <div key={rule.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-white">{rule.label}</div>
                  <div className="text-sm text-slate-300">{rule.description}</div>
                  <Badge className="mt-2 border-white/10 bg-white/10 text-white">{rule.channel}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => toggleAlert(rule.id, !rule.enabled, rule.label)}
                >
                  {rule.enabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
