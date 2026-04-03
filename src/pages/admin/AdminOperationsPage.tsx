import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAdminCommandHistory, runAdminOperation } from "@/lib/admin-operations";
import { Download, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const commands = [
  { key: "cache_clear", label: "Cache clear", scope: "system", description: "Refresh cache-backed admin queries and clear stale operation state." },
  { key: "queue_rebuild", label: "Queue rebuild", scope: "workers", description: "Re-seed workflow queues and mark worker orchestration as healthy." },
  { key: "ingest_sync", label: "Ingest sync", scope: "analytics", description: "Trigger a synthetic analytics sync and stamp the monitoring stream." },
  { key: "report_export", label: "Report export", scope: "reports", description: "Generate a maintenance export event for admin reporting pipelines." },
];

export default function AdminOperationsPage() {
  const { user, authUser, impersonationTarget } = useAuth();
  const queryClient = useQueryClient();
  const [running, setRunning] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "command-history"],
    queryFn: fetchAdminCommandHistory,
  });
  const history = data?.items ?? [];
  const historySource = data?.source ?? "database";

  const runCommand = async (commandKey: string, commandLabel: string, scope: string) => {
    const actorId = authUser?.id || user?.id;
    if (!actorId) return;
    if (impersonationTarget) {
      toast.error("Exit impersonation before running maintenance commands.");
      return;
    }
    setRunning(commandKey);
    try {
      const result = await runAdminOperation({ actorId, commandKey, commandLabel, scope });
      queryClient.invalidateQueries({ queryKey: ["admin", "command-history"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "monitoring-events"] });
      toast.success(
        result.source === "database"
          ? `${commandLabel} complete`
          : `${commandLabel} complete in fallback mode`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operation failed");
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Operations console</CardTitle>
          <CardDescription className="text-slate-300">Fast maintenance actions with persistent command history.</CardDescription>
        </CardHeader>
        {historySource === "local" && (
          <CardContent className="pt-0">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Supabase admin operations tables are not reachable yet, so this tab is using a local fallback history until the operations migration is applied and the schema cache is refreshed.
            </div>
          </CardContent>
        )}
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {commands.map((command) => (
            <div key={command.key} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{command.label}</div>
                  <div className="mt-1 text-sm text-slate-300">{command.description}</div>
                  <Badge className="mt-3 border-white/10 bg-white/10 text-white">{command.scope}</Badge>
                </div>
                {command.key === "cache_clear" ? <RefreshCw className="h-4 w-4 text-cyan-300" /> : command.key === "queue_rebuild" ? <RotateCcw className="h-4 w-4 text-cyan-300" /> : command.key === "ingest_sync" ? <Download className="h-4 w-4 text-cyan-300" /> : <Trash2 className="h-4 w-4 text-cyan-300" />}
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full justify-center border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => runCommand(command.key, command.label, command.scope)}
                disabled={running === command.key}
              >
                {running === command.key ? "Running..." : `Run ${command.label}`}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-white">Command history</CardTitle>
              <CardDescription className="text-slate-300">
                {historySource === "database" ? "Every maintenance command is stored in the database." : "Recent maintenance commands are temporarily stored in local fallback history."}
              </CardDescription>
            </div>
            <Badge className="border-white/10 bg-white/10 text-white">{historySource === "database" ? "Database" : "Fallback"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-300">Label</TableHead>
                <TableHead className="text-slate-300">Key</TableHead>
                <TableHead className="text-slate-300">Scope</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow className="border-white/10">
                  <TableCell colSpan={5} className="py-10 text-center text-slate-400">Loading operations history...</TableCell>
                </TableRow>
              )}
              {(history as any[]).map((entry) => (
                <TableRow key={entry.id} className="border-white/10">
                  <TableCell className="text-white">{entry.command_label}</TableCell>
                  <TableCell className="text-slate-300">{entry.command_key}</TableCell>
                  <TableCell className="text-slate-300">{entry.scope}</TableCell>
                  <TableCell><Badge className="border-white/10 bg-white/10 text-white">{entry.status}</Badge></TableCell>
                  <TableCell className="text-slate-400">{new Date(entry.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!history.length && (
                <TableRow className="border-white/10">
                  <TableCell colSpan={5} className="py-10 text-center text-slate-400">No maintenance commands have been run yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
