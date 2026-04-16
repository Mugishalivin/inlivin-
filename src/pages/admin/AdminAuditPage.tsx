import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchAdminProfiles } from "@/lib/admin-profiles";
import { FileClock, RefreshCw, Search, Download, Filter, Clock, Shield, Activity, TrendingUp, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const PAGE_SIZE = 20;

export default function AdminAuditPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["admin", "audit-page-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      return data ?? [];
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("audit-logs-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_audit_logs" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin", "audit-page-logs"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin", "audit-page-profiles"],
    queryFn: fetchAdminProfiles,
  });

  const actorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const profile of profiles as any[]) {
      map.set(profile.user_id, profile.display_name || profile.username || profile.user_id);
    }
    if (user?.id) map.set(user.id, "You");
    return map;
  }, [profiles, user?.id]);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    (auditLogs as any[]).forEach((e) => set.add(e.action));
    return Array.from(set).sort();
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = new Date();
    return (auditLogs as any[]).filter((entry) => {
      if (actionFilter !== "all" && entry.action !== actionFilter) return false;
      if (dateRange !== "all") {
        const entryDate = new Date(entry.created_at);
        if (dateRange === "today" && entryDate.toDateString() !== now.toDateString()) return false;
        if (dateRange === "week" && now.getTime() - entryDate.getTime() > 7 * 86400000) return false;
        if (dateRange === "month" && now.getTime() - entryDate.getTime() > 30 * 86400000) return false;
      }
      if (!term) return true;
      return [entry.action, entry.target_type, entry.target_id, JSON.stringify(entry.metadata ?? {})]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    });
  }, [auditLogs, search, actionFilter, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pagedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const actionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    (auditLogs as any[]).forEach((e) => { counts[e.action] = (counts[e.action] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [auditLogs]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return (auditLogs as any[]).filter((e) => new Date(e.created_at).toDateString() === today).length;
  }, [auditLogs]);

  const exportCSV = () => {
    const rows = filteredLogs.map((e: any) => ({
      actor: actorMap.get(e.actor_id) || e.actor_id || "system",
      action: e.action,
      target_type: e.target_type || "",
      target_id: e.target_id || "",
      metadata: JSON.stringify(e.metadata),
      created_at: e.created_at,
    }));
    const header = "Actor,Action,Target Type,Target ID,Metadata,Created At\n";
    const csv = header + rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "audit_logs.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit logs exported");
  };

  const copyEntry = (entry: any) => {
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Entries", value: (auditLogs as any[]).length, icon: Activity, color: "text-blue-500" },
          { label: "Today", value: todayCount, icon: Clock, color: "text-green-500" },
          { label: "Unique Actions", value: uniqueActions.length, icon: TrendingUp, color: "text-purple-500" },
          { label: "Filtered Results", value: filteredLogs.length, icon: Filter, color: "text-orange-500" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn("rounded-xl bg-muted p-2.5", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Top Actions */}
      {actionStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {actionStats.map(([action, count]) => (
                <Badge key={action} variant="secondary" className="cursor-pointer" onClick={() => setActionFilter(action)}>
                  {action} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileClock className="h-5 w-5 text-primary" />
                Audit Trail
              </CardTitle>
              <CardDescription>Complete history of admin actions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "audit-page-logs"] })}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="mr-1 h-3.5 w-3.5" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search logs..." className="pl-9" />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v: any) => { setDateRange(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="hidden md:table-cell">Target</TableHead>
                  <TableHead className="hidden lg:table-cell">Details</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedLogs.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{actorMap.get(entry.actor_id) || entry.actor_id?.slice?.(0, 8) || "system"}</TableCell>
                    <TableCell><Badge variant="secondary">{entry.action}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{[entry.target_type, entry.target_id?.slice(0, 8)].filter(Boolean).join(" / ") || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[300px] truncate text-muted-foreground text-xs">{JSON.stringify(entry.metadata ?? {})}</TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyEntry(entry)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!pagedLogs.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No audit logs found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages} ({filteredLogs.length} results)</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
