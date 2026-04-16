import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fetchAdminProfiles } from "@/lib/admin-profiles";
import { AlertTriangle, Ban, CheckCircle2, Copy, Download, Eye, EyeOff, Flag, MessageSquareWarning, RefreshCw, Search, ShieldAlert, ChevronLeft, ChevronRight, TrendingUp, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type ReportStatus = "open" | "reviewing" | "actioned" | "resolved" | "dismissed";
const PAGE_SIZE = 20;

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Open", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: Flag },
  reviewing: { label: "Reviewing", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Eye },
  actioned: { label: "Actioned", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: ShieldAlert },
  resolved: { label: "Resolved", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  dismissed: { label: "Dismissed", color: "bg-muted text-muted-foreground", icon: EyeOff },
};

export default function AdminReportsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const adminDb = supabase as any;
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [filter, setFilter] = useState<ReportStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: reports = [] } = useQuery({
    queryKey: ["admin", "user-reports"],
    queryFn: async () => (await adminDb.from("user_reports").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin", "reports-profiles"],
    queryFn: fetchAdminProfiles,
  });

  const actorLabel = (userId?: string | null) => {
    if (!userId) return "Unknown";
    const profile = (profiles as any[]).find((p) => p.user_id === userId);
    return profile?.display_name || profile?.username || userId.slice(0, 8);
  };

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (reports as any[]).filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!term) return true;
      return [actorLabel(r.reporter_id), actorLabel(r.reported_user_id), r.reason, r.entity_type, r.status]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(term));
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reports, filter, search, profiles]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const pagedReports = filteredReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { open: 0, reviewing: 0, actioned: 0, resolved: 0, dismissed: 0 };
    (reports as any[]).forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return counts;
  }, [reports]);

  const setReportStatus = async (report: any, status: ReportStatus, action: string) => {
    const { error } = await adminDb.from("user_reports").update({
      status, admin_action: action,
      admin_notes: adminNotes.trim() || null,
      resolved_by: status === "resolved" || status === "dismissed" ? user?.id : null,
      resolved_at: status === "resolved" || status === "dismissed" ? new Date().toISOString() : null,
    }).eq("id", report.id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "user-reports"] });
    toast.success(`Report marked ${status}`);
    setSelectedReport(null);
    setAdminNotes("");
  };

  const warnUser = async (report: any) => {
    await adminDb.from("profiles").update({ status: "review" }).eq("user_id", report.reported_user_id);
    await setReportStatus(report, "actioned", "warn_user");
  };

  const suspendUser = async (report: any) => {
    await adminDb.from("profiles").update({ status: "suspended" }).eq("user_id", report.reported_user_id);
    await setReportStatus(report, "actioned", "suspend_user");
  };

  const exportCSV = () => {
    const rows = filteredReports.map((r: any) => `"${actorLabel(r.reporter_id)}","${actorLabel(r.reported_user_id)}","${r.reason}","${r.status}","${r.created_at}"`);
    const csv = "Reporter,Reported,Reason,Status,Date\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "reports.csv"; a.click();
    toast.success("Exported");
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {Object.entries(statusCounts).map(([status, count], i) => {
          const config = statusConfig[status];
          return (
            <motion.div key={status} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all" onClick={() => { setFilter(status as any); setPage(1); }}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`rounded-lg p-2 ${config.color}`}>
                    <config.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-[11px] text-muted-foreground">{config.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-primary" />
                User Reports
              </CardTitle>
              <CardDescription>Review and manage reported content and users</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "user-reports"] })}>
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
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search reports..." className="pl-9" />
            </div>
            <Select value={filter} onValueChange={(v: any) => { setFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedReports.map((report: any) => {
                  const config = statusConfig[report.status] || statusConfig.open;
                  return (
                    <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedReport(report); setAdminNotes(""); }}>
                      <TableCell className="font-medium">{actorLabel(report.reporter_id)}</TableCell>
                      <TableCell>{actorLabel(report.reported_user_id)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{report.reason || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{report.entity_type || "user"}</Badge></TableCell>
                      <TableCell><Badge className={config.color}>{config.label}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(report.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!pagedReports.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No reports found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => { if (!open) setSelectedReport(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>Review and take action on this report</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Reporter:</span> <span className="font-medium">{actorLabel(selectedReport.reporter_id)}</span></div>
                <div><span className="text-muted-foreground">Reported:</span> <span className="font-medium">{actorLabel(selectedReport.reported_user_id)}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline">{selectedReport.entity_type || "user"}</Badge></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={statusConfig[selectedReport.status]?.color}>{statusConfig[selectedReport.status]?.label}</Badge></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Reason</p>
                <p className="text-sm rounded-lg bg-muted p-3">{selectedReport.reason || "No reason provided"}</p>
              </div>
              {selectedReport.details && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Additional Details</p>
                  <pre className="text-xs rounded-lg bg-muted p-3 overflow-auto max-h-32">{JSON.stringify(selectedReport.details, null, 2)}</pre>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Admin Notes</p>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes about this report..." rows={2} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setReportStatus(selectedReport, "reviewing", "start_review")}>
                  <Eye className="mr-1 h-3.5 w-3.5" /> Review
                </Button>
                <Button size="sm" variant="outline" className="text-yellow-600" onClick={() => warnUser(selectedReport)}>
                  <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Warn User
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => suspendUser(selectedReport)}>
                  <Ban className="mr-1 h-3.5 w-3.5" /> Suspend
                </Button>
                <Button size="sm" variant="outline" className="text-green-600" onClick={() => setReportStatus(selectedReport, "resolved", "resolve")}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Resolve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReportStatus(selectedReport, "dismissed", "dismiss")}>
                  <EyeOff className="mr-1 h-3.5 w-3.5" /> Dismiss
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
