import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, FileText, Megaphone, MessageCircle, Share2, ShieldAlert, Sparkles, Target } from "lucide-react";

export function SocialPlatformCard({ platform }: { platform: any }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            {platform.name || platform.title || "Platform"}
          </span>
          <Badge variant={platform.status === "active" ? "default" : "secondary"}>{platform.status || "ready"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>{platform.description || "Track publishing and moderation performance across your main channels."}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-border/50 p-2">Audience: {platform.audience || "n/a"}</div>
          <div className="rounded-lg border border-border/50 p-2">Reach: {platform.reach || "n/a"}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UnifiedInbox() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> Unified Inbox</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>All incoming admin messages and moderation notes will appear here.</p>
        <div className="rounded-lg border border-dashed p-4">No messages loaded yet.</div>
      </CardContent>
    </Card>
  );
}

export function ContentCalendar() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" /> Content Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Plan launches, announcements, and reminders on a simple timeline.</p>
        <div className="rounded-lg border border-dashed p-4">No scheduled items yet.</div>
      </CardContent>
    </Card>
  );
}

export function AssetLibrary() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Asset Library</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Store banners, banners, and reusable visuals in one place.</p>
        <div className="rounded-lg border border-dashed p-4">No assets indexed yet.</div>
      </CardContent>
    </Card>
  );
}

export function CompetitorBenchmark() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Competitor Benchmark</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Compare your performance with selected creators and identify gaps.</p>
        <div className="rounded-lg border border-dashed p-4">Benchmark data will appear here.</div>
      </CardContent>
    </Card>
  );
}

export function ReportGenerator() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-accent" /> Report Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Export summaries for launches, moderation, and performance reviews.</p>
        <Button variant="secondary" size="sm" className="gap-2"><Share2 className="h-4 w-4" /> Generate report</Button>
      </CardContent>
    </Card>
  );
}
