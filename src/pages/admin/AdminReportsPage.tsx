import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Ban, CheckCircle2, Copy, EyeOff, Flag, MessageSquareWarning, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type ReportStatus = "open" | "reviewing" | "actioned" | "resolved" | "dismissed";
type SortMode = "newest" | "oldest" | "priority";

const PAGE_SIZE = 25;

export default function AdminReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const adminDb = supabase as any;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReportStatus | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: reports = [] } = useQuery({
    queryKey: ["admin", "user-reports"],
    queryFn: async () => (await adminDb.from("user_reports").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin", "reports-profiles"],
    queryFn: async () => (await supabase.from("profiles").select("user_id, display_name, username, status, avatar_url")).data ?? [],
  });
  const { data: events = [] } = useQuery({
    queryKey: ["admin", "reports-events"],
    queryFn: async () => (await supabase.from("events").select("id, title, description, user_id, is_public").limit(200)).data ?? [],
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["admin", "reports-projects"],
    queryFn: async () => (await supabase.from("projects").select("id, title, description, user_id, is_public").limit(200)).data ?? [],
  });
  const { data: announcements = [] } = useQuery({
    queryKey: ["admin", "reports-announcements"],
    queryFn: async () => (await supabase.from("announcements").select("id, title, content, created_by, is_active").limit(200)).data ?? [],
  });
  const { data: promotions = [] } = useQuery({
    queryKey: ["admin", "reports-promotions"],
    queryFn: async () => (await supabase.from("promotions").select("id, title, content, created_by, is_active").limit(200)).data ?? [],
  });
  const { data: ads = [] } = useQuery({
    queryKey: ["admin", "reports-ads"],
    queryFn: async () => (await supabase.from("ads").select("id, title, content, created_by, is_active").limit(200)).data ?? [],
  });

  const reportMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const item of reports as any[]) map.set(item.id, item);
    return map;
  }, [reports]);

  const actorLabel = (userId?: string | null) => {
    if (!userId) return "n/a";
    const profile = (profiles as any[]).find((item) => item.user_id === userId);
    return profile?.display_name || profile?.username || userId;
  };

  const selectedReport = selectedId ? reportMap.get(selectedId) : (reports as any[])[0];

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (reports as any[]).filter((report) => {
      const matchesStatus = filter === "all" ? true : report.status === filter;
      const reporter = actorLabel(report.reporter_id).toLowerCase();
      const reported = actorLabel(report.reported_user_id).toLowerCase();
      const matchesTerm =
        !term ||
        reporter.includes(term) ||
        reported.includes(term) ||
        report.reason?.toLowerCase().includes(term) ||
        report.entity_type?.toLowerCase().includes(term) ||
        report.entity_id?.toLowerCase().includes(term) ||
        report.status?.toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
    const sorted = [...list].sort((a, b) => {
      if (sortMode === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortMode === "priority") {
        const priorityOrder: Record<string, number> = { open: 0, reviewing: 1, actioned: 2, resolved: 3, dismissed: 4 };
        return (priorityOrder[a.status] ?? 99) - (priorityOrder[b.status] ?? 99) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return sorted;
  }, [reports, filter, sortMode, search, profiles]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const pagedReports = filteredReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resolveEntity = (report: any) => {
    const entityType = report.entity_type;
    if (entityType === "event") return (events as any[]).find((item) => item.id === report.entity_id);
    if (entityType === "project") return (projects as any[]).find((item) => item.id === report.entity_id);
    if (entityType === "announcement") return (announcements as any[]).find((item) => item.id === report.entity_id);
    if (entityType === "promotion") return (promotions as any[]).find((item) => item.id === report.entity_id);
    if (entityType === "ad") return (ads as any[]).find((item) => item.id === report.entity_id);
    return null;
  };

  const setReportStatus = async (report: any, status: ReportStatus, action: string) => {
    const { error } = await adminDb.from("user_reports").update({
      status,
      admin_action: action,
      admin_notes: adminNotes.trim() || null,
      resolved_by: status === "resolved" || status === "dismissed" ? user?.id : null,
      resolved_at: status === "resolved" || status === "dismissed" ? new Date().toISOString() : null,
    }).eq("id", report.id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["admin", "user-reports"] });
    toast.success(`Report marked ${status}`);
  };

  const notifyReportedUser = async (report: any, message: string) => {
    if (!report.reported_user_id) return;
    await adminDb.from("notifications").insert([{
      user_id: report.reported_user_id,
      type: "moderation",
      title: "Account review update",
      message,
      reference_id: report.id,
      reference_type: "user_report",
    }]);
  };

  const warnUser = async (report: any) => {
    if (!report.reported_user_id) return toast.error("No reported user linked to this report");
    const { error } = await adminDb.from("profiles").update({ status: "review" }).eq("user_id", report.reported_user_id);
    if (error) return toast.error(error.message);
    await notifyReportedUser(report, "A report was filed against your account and it is now under review.");
    await setReportStatus(report, "actioned", "warn_user");
    toast.success("User placed under review");
  };

  const restoreUser = async (report: any) => {
    if (!report.reported_user_id) return toast.error("No reported user linked to this report");
    const { error } = await adminDb.from("profiles").update({ status: "active" }).eq("user_id", report.reported_user_id);
    if (error) return toast.error(error.message);
    await notifyReportedUser(report, "Your account status has been restored after a moderation review.");
    await setReportStatus(report, "resolved", "restore_user");
    toast.success("User restored to active");
  };

  const suspendUser = async (report: any) => {
    if (!report.reported_user_id) return toast.error("No reported user linked to this report");
    const { error } = await adminDb.from("profiles").update({ status: "suspended" }).eq("user_id", report.reported_user_id);
    if (error) return toast.error(error.message);
    await notifyReportedUser(report, "Your account was suspended after a moderation review.");
    await setReportStatus(report, "actioned", "suspend_user");
    toast.success("User suspended");
  };

  const hideEntity = async (report: any) => {
    const entity = resolveEntity(report);
    if (!entity) return toast.error("Linked content not found");
    const payload = report.entity_type === "event" || report.entity_type === "project"
      ? { is_public: false }
      : { is_active: false };
    const { error } = await adminDb.from(report.entity_type === "event" ? "events" : report.entity_type === "project" ? "projects" : report.entity_type === "announcement" ? "announcements" : report.entity_type === "promotion" ? "promotions" : "ads")
      .update(payload)
      .eq("id", report.entity_id);
    if (error) return toast.error(error.message);
    await setReportStatus(report, "actioned", "hide_entity");
    toast.success("Related content hidden");
  };

  const markReviewing = async (report: any) => {
    await setReportStatus(report, "reviewing", "start_review");
  };

  const resolveReport = async (report: any) => {
    await setReportStatus(report, "resolved", "resolve_report");
  };

  const dismissReport = async (report: any) => {
    await setReportStatus(report, "dismissed", "dismiss_report");
  };

  const copyDetails = async (report: any) => {
    const entity = resolveEntity(report);
    const payload = JSON.stringify({ report, entity }, null, 2);
    await navigator.clipboard.writeText(payload);
    toast.success("Report details copied");
  };

  const openEntity = (report: any) => {
    if (report.entity_type === "user" && report.reported_user_id) {
      navigate(`/profile/${report.reported_user_id}`);
      return;
    }
    if (report.entity_type === "event") navigate(`/events/${report.entity_id}`);
    if (report.entity_type === "project") navigate(`/projects/${report.entity_id}`);
    if (report.entity_type === "announcement" || report.entity_type === "promotion" || report.entity_type === "ad") navigate("/admin/content");
  };

  const stats = useMemo(() => {
    const buckets = { open: 0, reviewing: 0, actioned: 0, resolved: 0, dismissed: 0 };
    for (const report of reports as any[]) buckets[report.status as keyof typeof buckets] = (buckets[report.status as keyof typeof buckets] || 0) + 1;
    return buckets;
  }, [reports]);

  const selectedEntity = selectedReport ? resolveEntity(selectedReport) : null;

  const goToPage = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(safePage);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Flag className="h-5 w-5 text-primary" />
                Reports queue
              </CardTitle>
              <CardDescription className="text-muted-foreground">User-submitted issues, content flags, and moderation actions in one place.</CardDescription>
            </div>
            <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin", "user-reports"] })}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-5">
            <MiniStat label="Open" value={stats.open} />
            <MiniStat label="Reviewing" value={stats.reviewing} />
            <MiniStat label="Actioned" value={stats.actioned} />
            <MiniStat label="Resolved" value={stats.resolved} />
            <MiniStat label="Dismissed" value={stats.dismissed} />
          </CardContent>
        </Card>

        <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-foreground">All reports</CardTitle>
                <CardDescription className="text-muted-foreground">Click a row to inspect the report and act on it.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search reports, users, or entity..."
                  className="w-72 border-border bg-background"
                />
                <Select value={filter} onValueChange={(value) => { setFilter(value as ReportStatus | "all"); setPage(1); }}>
                  <SelectTrigger className="w-36 border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="actioned">Actioned</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                  <SelectTrigger className="w-40 border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Reason</TableHead>
                  <TableHead className="text-muted-foreground">Reported</TableHead>
                  <TableHead className="text-muted-foreground">Entity</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedReports.map((report: any) => (
                  <TableRow
                    key={report.id}
                    className={`cursor-pointer border-border ${selectedReport?.id === report.id ? "bg-primary/5" : ""}`}
                    onClick={() => {
                      setSelectedId(report.id);
                      setAdminNotes(report.admin_notes || "");
                    }}
                  >
                    <TableCell className="text-foreground">
                      <div className="font-medium">{report.reason}</div>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{report.details?.report_details || "No extra details."}</div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div className="font-medium">{actorLabel(report.reporter_id)}</div>
                      <div className="text-xs text-muted-foreground">{report.reporter_id}</div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div className="font-medium">{actorLabel(report.reported_user_id)}</div>
                      <div className="text-xs text-muted-foreground">{report.entity_type} / {report.entity_id}</div>
                    </TableCell>
                    <TableCell><Badge className="border-border bg-secondary text-foreground">{report.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{new Date(report.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {!pagedReports.length && (
                  <TableRow className="border-border">
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No reports match your filters.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Showing {filteredReports.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredReports.length)} of {filteredReports.length}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => goToPage(page - 1)} disabled={page === 1}>
                  Previous
                </Button>
                <Badge className="border-border bg-secondary text-foreground">Page {page} / {totalPages}</Badge>
                <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-foreground">Report details</CardTitle>
            <CardDescription className="text-muted-foreground">Full issue context and moderation tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedReport ? (
              <>
                <div className="rounded-3xl border border-border bg-background p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Reason</div>
                  <div className="mt-2 text-lg font-semibold text-foreground">{selectedReport.reason}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{selectedReport.details?.report_details || "No extra details provided."}</div>
                </div>
                <div className="rounded-3xl border border-border bg-background p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Reported user</div>
                  <div className="mt-2 text-lg font-semibold text-foreground">{actorLabel(selectedReport.reported_user_id)}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Reporter: {actorLabel(selectedReport.reporter_id)}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Reporter ID: {selectedReport.reporter_id}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Status: {((profiles as any[]).find((item) => item.user_id === selectedReport.reported_user_id)?.status) || "active"}</div>
                  <div className="mt-2 rounded-2xl border border-border bg-card p-3">
                    <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">User info</div>
                    <div className="mt-1 text-sm text-foreground">Reported by: {actorLabel(selectedReport.reporter_id)}</div>
                    <div className="text-sm text-foreground">Reported: {actorLabel(selectedReport.reported_user_id)}</div>
                  </div>
                </div>
                <div className="rounded-3xl border border-border bg-background p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Linked content</div>
                  <div className="mt-2 text-lg font-semibold text-foreground">{selectedReport.entity_type} / {selectedReport.entity_id}</div>
                  <div className="mt-1 text-sm text-muted-foreground line-clamp-4">{selectedEntity?.title || selectedEntity?.description || selectedEntity?.content || "No linked content loaded."}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="border-border bg-background hover:bg-secondary" onClick={() => copyDetails(selectedReport)}>
                      <Copy className="h-4 w-4" />
                      Copy details
                    </Button>
                    <Button variant="outline" size="sm" className="border-border bg-background hover:bg-secondary" onClick={() => openEntity(selectedReport)}>
                      Open entity
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add internal moderation notes..." className="min-h-24 border-border bg-background" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => markReviewing(selectedReport)}>
                      <MessageSquareWarning className="h-4 w-4" />
                      Start review
                    </Button>
                    <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => warnUser(selectedReport)}>
                      <ShieldAlert className="h-4 w-4" />
                      Warn user
                    </Button>
                    <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => suspendUser(selectedReport)}>
                      <Ban className="h-4 w-4" />
                      Suspend user
                    </Button>
                    <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => restoreUser(selectedReport)}>
                      <CheckCircle2 className="h-4 w-4" />
                      Restore user
                    </Button>
                    <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => hideEntity(selectedReport)}>
                      <EyeOff className="h-4 w-4" />
                      Hide content
                    </Button>
                    <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => resolveReport(selectedReport)}>
                      <CheckCircle2 className="h-4 w-4" />
                      Resolve
                    </Button>
                    <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => dismissReport(selectedReport)}>
                      <AlertTriangle className="h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                  <div className="rounded-3xl border border-border bg-background p-4 text-sm text-foreground">
                    Organized queue: use search, status filters, priority sorting, and pagination to handle larger volumes of reports.
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-background p-8 text-center text-muted-foreground">
                Select a report to see the moderation options.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/95 shadow-sm backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-foreground">Quick effect</CardTitle>
            <CardDescription className="text-muted-foreground">Actions applied here change the reported user and linked content immediately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-3xl border border-border bg-background p-4 text-sm text-foreground">
              {selectedReport?.reported_user_id ? (
                <>Reported user: <strong>{actorLabel(selectedReport.reported_user_id)}</strong> can be warned, suspended, or returned to active status from this panel.</>
              ) : (
                <>No user is linked to this report.</>
              )}
            </div>
            <div className="rounded-3xl border border-border bg-background p-4 text-sm text-foreground">
              Linked content can be hidden from the platform without deleting it, so moderation stays reversible.
            </div>
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
