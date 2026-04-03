import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileClock, RefreshCw, Search } from "lucide-react";

export default function AdminAuditPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["admin", "audit-page-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin", "audit-page-profiles"],
    queryFn: async () => (await supabase.from("profiles").select("user_id, display_name, username")).data ?? [],
  });

  const actorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const profile of profiles as any[]) {
      map.set(profile.user_id, profile.display_name || profile.username || profile.user_id);
    }
    if (user?.id) map.set(user.id, "You");
    return map;
  }, [profiles, user?.id]);

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return auditLogs as any[];
    return (auditLogs as any[]).filter((entry) =>
      [entry.action, entry.entity_type, entry.entity_id, JSON.stringify(entry.details ?? {})]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [auditLogs, search]);

  const uniqueActions = new Set((auditLogs as any[]).map((entry) => entry.action)).size;

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileClock className="h-5 w-5 text-cyan-300" />
              Audit Logs
            </CardTitle>
            <CardDescription className="text-slate-300">Trace every admin write path, review history, and search actions quickly.</CardDescription>
          </div>
          <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "audit-page-logs"] })}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <MiniStat label="Entries" value={(auditLogs as any[]).length} />
          <MiniStat label="Unique actions" value={uniqueActions} />
          <MiniStat label="Filtered" value={filteredLogs.length} />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-white">Search audit trail</CardTitle>
              <CardDescription className="text-slate-300">Search by action, entity, or serialized details.</CardDescription>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="border-white/10 bg-black/20 pl-9 text-white placeholder:text-slate-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-300">Actor</TableHead>
                <TableHead className="text-slate-300">Action</TableHead>
                <TableHead className="text-slate-300">Entity</TableHead>
                <TableHead className="text-slate-300">Details</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((entry: any) => (
                <TableRow key={entry.id} className="border-white/10">
                  <TableCell className="text-white">{actorMap.get(entry.actor_id) || entry.actor_id?.slice?.(0, 8) || "system"}</TableCell>
                  <TableCell><Badge className="border-white/10 bg-white/10 text-white">{entry.action}</Badge></TableCell>
                  <TableCell className="text-slate-300">{[entry.entity_type, entry.entity_id].filter(Boolean).join(" / ") || "n/a"}</TableCell>
                  <TableCell className="max-w-[420px] break-words text-slate-300">{JSON.stringify(entry.details ?? {})}</TableCell>
                  <TableCell className="text-slate-400">{new Date(entry.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!filteredLogs.length && (
                <TableRow className="border-white/10">
                  <TableCell colSpan={5} className="py-10 text-center text-slate-400">
                    No audit logs matched your search.
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
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
    </div>
  );
}
