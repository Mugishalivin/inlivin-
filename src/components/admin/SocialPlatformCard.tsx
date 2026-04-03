import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, ExternalLink, FileText, Megaphone, MessageCircle, Share2, Sparkles, Target, TrendingUp, RefreshCw, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function SocialPlatformCard({ platform }: { platform: any }) {
  const score = platform.status === "active" ? 92 : platform.status === "growth" ? 78 : 64;
  const handleAnalytics = async () => {
    const summary = `${platform.name || "Platform"} engagement readiness: ${score}%`;
    try {
      await navigator.clipboard.writeText(summary);
      toast.success("Analytics summary copied");
    } catch {
      toast.success(summary);
    }
  };

  const handleOpenChannel = () => {
    if (platform.url) {
      window.open(platform.url, "_blank", "noopener,noreferrer");
      toast.success(`Opening ${platform.name || "channel"}`);
      return;
    }
    toast.success(`${platform.name || "Channel"} is connected and ready to review.`);
  };

  return (
    <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-xl shadow-black/10 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription className="text-slate-400">Channel</CardDescription>
            <CardTitle className="mt-1 flex items-center gap-2 text-lg text-white">
              <Megaphone className="h-4 w-4 text-cyan-300" />
              {platform.name || platform.title || "Platform"}
            </CardTitle>
          </div>
          <Badge className={cn("border-white/10", platform.status === "active" ? "bg-emerald-400/10 text-emerald-100" : "bg-white/10 text-slate-200")}>
            {platform.status || "ready"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-slate-300">
          {platform.description || "Track publishing and moderation performance across your main channels."}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <MiniMetric label="Audience" value={platform.audience || "n/a"} />
          <MiniMetric label="Reach" value={platform.reach || "n/a"} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Engagement readiness</span>
            <span>{score}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400" style={{ width: `${score}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={handleAnalytics}>
            <TrendingUp className="h-4 w-4" />
            Analytics
          </Button>
          <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={handleOpenChannel}>
            <ExternalLink className="h-4 w-4" />
            Open channel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function UnifiedInbox() {
  const [scope, setScope] = useState("all");
  const items = useMemo(
    () => [
      { id: 1, name: "Mia Chen", message: "New campaign question about the launch window.", tag: "Priority", unread: true },
      { id: 2, name: "Studio Ops", message: "Moderation note added to the latest announcement.", tag: "Ops", unread: false },
      { id: 3, name: "Alex Row", message: "Requested a follow-up on the promo asset.", tag: "Reply", unread: true },
    ].filter((item) => {
      if (scope === "all") return true;
      if (scope === "unread") return item.unread;
      return item.tag.toLowerCase() === scope;
    }),
    [scope],
  );

  return (
    <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageCircle className="h-4 w-4 text-cyan-300" />
              Unified Inbox
            </CardTitle>
            <CardDescription className="text-slate-300">Fast triage for messages, moderation notes, and replies.</CardDescription>
          </div>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="w-32 border-white/10 bg-white/5 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="reply">Reply</SelectItem>
              <SelectItem value="ops">Ops</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-white">{item.name}</div>
                  {item.unread && <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">Unread</Badge>}
                </div>
                <div className="mt-1 text-sm text-slate-300">{item.message}</div>
              </div>
              <Badge className="border-white/10 bg-white/10 text-slate-200">{item.tag}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ContentCalendar() {
  const [day, setDay] = useState("today");
  const schedule = {
    today: ["09:00 - Announcement polish", "13:30 - Promo review", "18:00 - Ad check"],
    tomorrow: ["10:00 - Content audit", "15:00 - Creator sync"],
  } as const;

  return (
    <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-4 w-4 text-amber-300" />
              Content Calendar
            </CardTitle>
            <CardDescription className="text-slate-300">A clean schedule lane for launches and reminders.</CardDescription>
          </div>
          <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setDay(day === "today" ? "tomorrow" : "today")}>
            <RefreshCw className="h-4 w-4" />
            Switch day
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {schedule[day as keyof typeof schedule].map((entry) => (
          <div key={entry} className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
            {entry}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AssetLibrary() {
  const [filter, setFilter] = useState("");
  const assets = useMemo(
    () => ["Campaign hero", "Promo banner", "Story frame", "Launch cover", "Square ad"].filter((name) => name.toLowerCase().includes(filter.toLowerCase())),
    [filter],
  );

  return (
    <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="h-4 w-4 text-fuchsia-300" />
          Asset Library
        </CardTitle>
        <CardDescription className="text-slate-300">Store reusable visuals in one place.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter assets..." className="border-white/10 bg-black/20 text-white placeholder:text-slate-500" />
        <div className="grid gap-2 sm:grid-cols-2">
          {assets.map((asset) => (
            <div key={asset} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
              {asset}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CompetitorBenchmark() {
  const rows = [
    { name: "Creator A", score: 82 },
    { name: "Creator B", score: 68 },
    { name: "Creator C", score: 74 },
  ];

  return (
    <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Target className="h-4 w-4 text-cyan-300" />
          Competitor Benchmark
        </CardTitle>
        <CardDescription className="text-slate-300">Compare your performance with selected creators and identify gaps.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.name} className="space-y-1 rounded-3xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between text-sm text-slate-200">
              <span>{row.name}</span>
              <span>{row.score}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-fuchsia-400" style={{ width: `${row.score}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReportGenerator() {
  const [reportType, setReportType] = useState("weekly");
  const [autoSend, setAutoSend] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  const report = useMemo(() => {
    const title = reportType === "launch" ? "Launch report" : reportType === "moderation" ? "Moderation report" : "Weekly report";
    return [
      title,
      `Generated: ${new Date().toLocaleString()}`,
      `Auto send: ${autoSend ? "enabled" : "disabled"}`,
      "",
      "Summary",
      "- Content pipeline is active",
      "- Social channels are connected",
      "- Admin workspace is ready for review",
    ].join("\n");
  }, [reportType, autoSend]);

  const downloadReport = () => {
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const generateReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      downloadReport();
      toast.success("Report copied and downloaded");
    } catch {
      downloadReport();
    }
  };

  return (
    <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="h-4 w-4 text-amber-300" />
          Report Generator
        </CardTitle>
        <CardDescription className="text-slate-300">Export summaries for launches, moderation, and performance reviews.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="border-white/10 bg-black/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="launch">Launch</SelectItem>
            <SelectItem value="moderation">Moderation</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-black/20 p-4">
          <span className="text-sm text-slate-300">Auto send</span>
          <Switch checked={autoSend} onCheckedChange={setAutoSend} />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-2" onClick={generateReport}>
            <Share2 className="h-4 w-4" />
            Generate report
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setPreviewOpen(true)}>
            <ExternalLink className="h-4 w-4" />
            Preview
          </Button>
        </div>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="border-white/10 bg-slate-950 text-white">
            <DialogHeader>
              <DialogTitle>Report Preview</DialogTitle>
            </DialogHeader>
            <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-200">{report}</pre>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
