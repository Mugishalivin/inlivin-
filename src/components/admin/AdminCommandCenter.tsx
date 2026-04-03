import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowDownAZ,
  Bot,
  CheckSquare,
  ClipboardCopy,
  Copy,
  Database,
  Download,
  EyeOff,
  Calendar,
  FileText,
  Filter,
  Image,
  LayoutGrid,
  LayoutList,
  Megaphone,
  RefreshCw,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  Users,
  Wand2,
  Zap,
  ArrowRightLeft,
  Activity,
} from "lucide-react";

type ContentType = "announcement" | "promotion" | "ad";
type SortMode = "newest" | "oldest" | "alpha";
type Mode = "overview" | "content" | "users";

type AdminPreferences = {
  focusMode: boolean;
  denseMode: boolean;
  groupByType: boolean;
  showInactive: boolean;
  showMediaOnly: boolean;
  highlightExpiring: boolean;
  showCreators: boolean;
  showTimestamps: boolean;
  autoRefresh: boolean;
  highContrast: boolean;
};

type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  media_url?: string | null;
  media_type?: string | null;
  created_by?: string;
  discount_percentage?: number | null;
  valid_until?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  target_audience?: string | null;
};

type ActivityEntry = { id: string; title: string; detail: string; time: string };

const PREF_KEY = "ilivin-admin-workbench-prefs-v2";
const defaultPrefs: AdminPreferences = {
  focusMode: false,
  denseMode: false,
  groupByType: true,
  showInactive: true,
  showMediaOnly: false,
  highlightExpiring: true,
  showCreators: true,
  showTimestamps: true,
  autoRefresh: false,
  highContrast: false,
};

const typeMeta: Record<ContentType, { label: string; shortLabel: string; icon: typeof Megaphone; accent: string }> = {
  announcement: { label: "Announcement", shortLabel: "Ann", icon: Megaphone, accent: "text-cyan-300" },
  promotion: { label: "Promotion", shortLabel: "Prom", icon: Tag, accent: "text-fuchsia-300" },
  ad: { label: "Ad Campaign", shortLabel: "Ad", icon: Image, accent: "text-amber-300" },
};

function loadPrefs(): AdminPreferences {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    return { ...defaultPrefs, ...(JSON.parse(localStorage.getItem(PREF_KEY) || "{}") as Partial<AdminPreferences>) };
  } catch {
    return defaultPrefs;
  }
}

function selectionKey(item: ContentItem) {
  return `${item.type}:${item.id}`;
}

function buildSummary({
  activeCount,
  inactiveCount,
  withMediaCount,
  expiringSoonCount,
  creatorCount,
  selectedCount,
  items,
}: {
  activeCount: number;
  inactiveCount: number;
  withMediaCount: number;
  expiringSoonCount: number;
  creatorCount: number;
  selectedCount: number;
  items: ContentItem[];
}) {
  const typeCounts = items.reduce<Record<string, number>>((acc, item) => ((acc[item.type] = (acc[item.type] || 0) + 1), acc), {
    announcement: 0,
    promotion: 0,
    ad: 0,
  });
  return [
    "Admin workspace summary",
    `Active: ${activeCount}`,
    `Inactive: ${inactiveCount}`,
    `Media items: ${withMediaCount}`,
    `Expiring soon: ${expiringSoonCount}`,
    `Creators loaded: ${creatorCount}`,
    `Selected items: ${selectedCount}`,
    `Announcements: ${typeCounts.announcement ?? 0}`,
    `Promotions: ${typeCounts.promotion ?? 0}`,
    `Ads: ${typeCounts.ad ?? 0}`,
  ].join("\n");
}

export function AdminCommandCenter({ mode = "overview" }: { mode?: Mode }) {
  const queryClient = useQueryClient();
  const adminDb = supabase as any;
  const [prefs, setPrefs] = useState<AdminPreferences>(() => loadPrefs());
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const { data: announcements = [] } = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: promotions = [] } = useQuery({
    queryKey: ["admin", "promotions"],
    queryFn: async () => (await supabase.from("promotions").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: ads = [] } = useQuery({
    queryKey: ["admin", "ads"],
    queryFn: async () => (await supabase.from("ads").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select(`*, user_roles(role)`).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: async () => {
      const { data } = await adminDb
        .from("admin_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);
      return data ?? [];
    },
  });
  const { data: featureFlags = [] } = useQuery({
    queryKey: ["admin", "feature-flags"],
    queryFn: async () => {
      const { data } = await adminDb
        .from("admin_feature_flags")
        .select("*")
        .order("section", { ascending: true })
        .order("flag_key", { ascending: true });
      return data ?? [];
    },
  });
  const { data: callSessions = [] } = useQuery({
    queryKey: ["admin", "call-sessions"],
    queryFn: async () => {
      const { data } = await supabase.from("call_sessions").select("*").order("created_at", { ascending: false }).limit(12);
      return data ?? [];
    },
  });

  const creatorNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const userProfile of users as any[]) map.set(userProfile.user_id, userProfile.display_name || userProfile.username || userProfile.user_id);
    return map;
  }, [users]);

  const contentItems = useMemo<ContentItem[]>(
    () => [
      ...(announcements as any[]).map((item) => ({ id: item.id, type: "announcement", title: item.title, content: item.content, is_active: item.is_active, created_at: item.created_at, media_url: item.media_url, media_type: item.media_type, created_by: item.created_by })),
      ...(promotions as any[]).map((item) => ({ id: item.id, type: "promotion", title: item.title, content: item.content, is_active: item.is_active, created_at: item.created_at, media_url: item.media_url, media_type: item.media_type, created_by: item.created_by, discount_percentage: item.discount_percentage, valid_until: item.valid_until })),
      ...(ads as any[]).map((item) => ({ id: item.id, type: "ad", title: item.title, content: item.content, is_active: item.is_active, created_at: item.created_at, media_url: item.media_url, media_type: item.media_type, created_by: item.created_by, image_url: item.image_url, link_url: item.link_url, target_audience: item.target_audience })),
    ],
    [announcements, promotions, ads],
  );

  useEffect(() => {
    if (!prefs.autoRefresh) return;
    const id = window.setInterval(() => queryClient.invalidateQueries({ queryKey: ["admin"] }), 60000);
    return () => window.clearInterval(id);
  }, [prefs.autoRefresh, queryClient]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...contentItems]
      .filter((item) => (prefs.showInactive ? true : item.is_active))
      .filter((item) => (prefs.showMediaOnly ? Boolean(item.media_url || item.image_url) : true))
      .filter((item) => {
        if (!term) return true;
        return [item.title, item.content, item.target_audience, item.link_url].filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((a, b) => {
        if (sortMode === "alpha") return a.title.localeCompare(b.title);
        const left = new Date(a.created_at).getTime();
        const right = new Date(b.created_at).getTime();
        return sortMode === "oldest" ? left - right : right - left;
      });
  }, [contentItems, prefs.showInactive, prefs.showMediaOnly, search, sortMode]);

  const groupedItems = useMemo(() => {
    const map: Record<ContentType, ContentItem[]> = { announcement: [], promotion: [], ad: [] };
    for (const item of filteredItems) map[item.type].push(item);
    return map;
  }, [filteredItems]);

  const selectedItems = useMemo(() => contentItems.filter((item) => selected[selectionKey(item)]), [contentItems, selected]);
  const activeCount = contentItems.filter((item) => item.is_active).length;
  const inactiveCount = contentItems.length - activeCount;
  const withMediaCount = contentItems.filter((item) => item.media_url || item.image_url).length;
  const expiringSoonCount = (promotions as any[]).filter((item) => {
    if (!item.valid_until || !item.is_active) return false;
    const diff = new Date(item.valid_until).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  }).length;
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const creatorCount = users.length;
  const dau = (users as any[]).filter((item) => {
    if (!item.last_seen_at) return false;
    return Date.now() - new Date(item.last_seen_at).getTime() <= 24 * 60 * 60 * 1000;
  }).length;
  const conversionRate = contentItems.length > 0 ? Math.round((activeCount / contentItems.length) * 100) : 0;
  const errorCount = (callSessions as any[]).filter((item) => item.status === "failed" || item.status === "ended").length;
  const avgSessionLength = useMemo(() => {
    const sessions = (callSessions as any[])
      .filter((item) => item.started_at && item.ended_at)
      .map((item) => new Date(item.ended_at).getTime() - new Date(item.started_at).getTime());
    if (!sessions.length) return "0m";
    const avgMinutes = Math.round(sessions.reduce((sum, value) => sum + value, 0) / sessions.length / 60000);
    return `${avgMinutes}m`;
  }, [callSessions]);
  const healthScore = Math.round(Math.max(30, Math.min(98, 100 - inactiveCount * 2 + withMediaCount + (prefs.autoRefresh ? 4 : 0))));
  const healthLabel = healthScore > 85 ? "Thriving" : healthScore > 65 ? "Stable" : "Needs attention";

  function addActivity(title: string, detail: string) {
    setActivity((current) => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, title, detail, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...current].slice(0, 6));
  }
  async function logAdminAction(action: string, details: Record<string, unknown> = {}, entityType?: string, entityId?: string) {
    try {
      await adminDb.from("admin_audit_logs").insert([
        {
          actor_id: authUser?.id,
          actor_role: "admin",
          action,
          entity_type: entityType ?? null,
          entity_id: entityId ?? null,
          details,
        },
      ]);
    } catch {
      // Audit logging should never block the admin action itself.
    }
  }
  async function toggleFeatureFlag(flagId: string, enabled: boolean, key: string) {
    const { error } = await adminDb.from("admin_feature_flags").update({ enabled, updated_by: authUser?.id }).eq("id", flagId);
    if (error) {
      toast.error("Failed to update feature flag: " + error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] });
    addActivity(enabled ? "Feature enabled" : "Feature disabled", key);
    toast.success(`${key} ${enabled ? "enabled" : "disabled"}`);
    void logAdminAction(enabled ? "feature_enable" : "feature_disable", { flag_key: key, enabled }, "feature_flag", flagId);
  }
  function togglePreference(key: keyof AdminPreferences) {
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
  }
  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    addActivity("Manual refresh", "All admin feeds were reloaded.");
    toast.success("Workspace refreshed");
    void logAdminAction("refresh_workspace", { scope: "admin" });
  }
  function selectVisible() {
    const next: Record<string, boolean> = {};
    filteredItems.forEach((item) => {
      next[selectionKey(item)] = true;
    });
    setSelected(next);
    addActivity("Visible items selected", `${filteredItems.length} cards are selected.`);
    void logAdminAction("select_visible_items", { count: filteredItems.length });
  }
  function clearSelection() {
    setSelected({});
    addActivity("Selection cleared", "No cards are selected now.");
  }
  async function bulkUpdateActiveState(nextActive: boolean) {
    if (!selectedItems.length) return toast.error("Select at least one item first.");
    const groups = selectedItems.reduce<Record<ContentType, ContentItem[]>>((acc, item) => {
      acc[item.type].push(item);
      return acc;
    }, { announcement: [], promotion: [], ad: [] });
    await Promise.all([
      ...groups.announcement.map((item) => supabase.from("announcements").update({ is_active: nextActive }).eq("id", item.id)),
      ...groups.promotion.map((item) => supabase.from("promotions").update({ is_active: nextActive }).eq("id", item.id)),
      ...groups.ad.map((item) => supabase.from("ads").update({ is_active: nextActive }).eq("id", item.id)),
    ]);
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    setSelected({});
    addActivity(nextActive ? "Bulk activated" : "Bulk deactivated", `${selectedItems.length} content items changed state.`);
    toast.success(nextActive ? "Selected items activated" : "Selected items deactivated");
    void logAdminAction(nextActive ? "bulk_activate" : "bulk_deactivate", { count: selectedItems.length }, "content");
  }
  async function bulkDelete() {
    if (!selectedItems.length) return toast.error("Select at least one item first.");
    if (!window.confirm(`Delete ${selectedItems.length} selected items? This cannot be undone.`)) return;
    const groups = selectedItems.reduce<Record<ContentType, ContentItem[]>>((acc, item) => {
      acc[item.type].push(item);
      return acc;
    }, { announcement: [], promotion: [], ad: [] });
    await Promise.all([
      ...groups.announcement.map((item) => supabase.from("announcements").delete().eq("id", item.id)),
      ...groups.promotion.map((item) => supabase.from("promotions").delete().eq("id", item.id)),
      ...groups.ad.map((item) => supabase.from("ads").delete().eq("id", item.id)),
    ]);
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    setSelected({});
    addActivity("Bulk delete", `${selectedItems.length} items were removed.`);
    toast.success("Selected items deleted");
    void logAdminAction("bulk_delete", { count: selectedItems.length }, "content");
  }
  async function copySummary() {
    try {
      await navigator.clipboard.writeText(buildSummary({ activeCount, inactiveCount, withMediaCount, expiringSoonCount, creatorCount, selectedCount, items: filteredItems }));
      addActivity("Summary copied", "A workspace summary was copied.");
      toast.success("Summary copied");
      void logAdminAction("copy_summary", { visible: filteredItems.length });
    } catch {
      toast.error("Could not copy summary");
    }
  }
  function exportSnapshot() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), prefs, stats: { activeCount, inactiveCount, withMediaCount, expiringSoonCount, creatorCount, selectedCount }, visibleItems: filteredItems }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addActivity("Snapshot exported", "The current admin workspace was downloaded.");
    toast.success("Snapshot exported");
    void logAdminAction("export_snapshot", { visible: filteredItems.length });
  }
  async function generateBrief() {
    try {
      await navigator.clipboard.writeText(buildSummary({ activeCount, inactiveCount, withMediaCount, expiringSoonCount, creatorCount, selectedCount, items: selectedItems.length ? selectedItems : filteredItems }));
      addActivity("Brief generated", "A concise campaign brief was copied.");
      toast.success("Brief copied to clipboard");
      void logAdminAction("generate_brief", { selected: selectedCount, visible: filteredItems.length });
    } catch {
      toast.error("Could not generate brief");
    }
  }
  function resetLayout() {
    setPrefs(defaultPrefs);
    setSearch("");
    setSortMode("newest");
    setSelected({});
    addActivity("Layout reset", "All view preferences returned to defaults.");
    toast.success("Layout reset");
    void logAdminAction("reset_layout", {});
  }

  function runMaintenanceTask(task: "cache_clear" | "queue_rebuild" | "ingest_sync" | "mfa_reminder") {
    addActivity("Maintenance task", task.replace("_", " "));
    toast.success(`${task.replace("_", " ")} complete`);
    void logAdminAction(task, {});
  }

  function importSnapshot() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const raw = await file.text();
        const snapshot = JSON.parse(raw);
        if (snapshot.preferences) {
          setPrefs({ ...defaultPrefs, ...snapshot.preferences });
          toast.success("Preferences imported");
        }
        addActivity("Snapshot imported", file.name);
        void logAdminAction("import_snapshot", { file_name: file.name });
      } catch (error: any) {
        toast.error("Import failed: " + error.message);
      }
    };
    input.click();
  }

  const deck = [
    ["Focus Mode", Rocket, prefs.focusMode, () => togglePreference("focusMode")],
    ["Dense Mode", LayoutList, prefs.denseMode, () => togglePreference("denseMode")],
    ["Group by Type", Database, prefs.groupByType, () => togglePreference("groupByType")],
    ["Show Inactive", EyeOff, prefs.showInactive, () => togglePreference("showInactive")],
    ["Media Only", Image, prefs.showMediaOnly, () => togglePreference("showMediaOnly")],
    ["Highlight Expiring", Shield, prefs.highlightExpiring, () => togglePreference("highlightExpiring")],
    ["Show Creators", Users, prefs.showCreators, () => togglePreference("showCreators")],
    ["Show Timestamps", Calendar, prefs.showTimestamps, () => togglePreference("showTimestamps")],
    ["Auto Refresh", RefreshCw, prefs.autoRefresh, () => togglePreference("autoRefresh")],
    ["High Contrast", Sparkles, prefs.highContrast, () => togglePreference("highContrast")],
  ] as const;
  const actions = [
    ["Refresh Data", RefreshCw, refreshAll],
    ["Select Visible", CheckSquare, selectVisible],
    ["Clear Selection", ClipboardCopy, clearSelection],
    ["Activate Selected", Zap, () => bulkUpdateActiveState(true)],
    ["Deactivate Selected", EyeOff, () => bulkUpdateActiveState(false)],
    ["Delete Selected", Trash2, bulkDelete],
    ["Copy Summary", Copy, copySummary],
    ["Export Snapshot", Download, exportSnapshot],
    ["Generate Brief", Wand2, generateBrief],
    ["Reset Layout", ArrowDownAZ, resetLayout],
  ] as const;

  if (mode === "users") return <UsersPanel users={users as any[]} isLoading={loadingUsers} />;

  return (
    <div className="space-y-6">
      {mode === "overview" && (
        <>
          <div className={cn("grid gap-6", prefs.focusMode ? "xl:grid-cols-1" : "xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]")}>
            <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-white">Live Metrics</CardTitle>
                  <CardDescription className="text-slate-300">A snapshot of the admin workspace right now.</CardDescription>
                </div>
                <Badge className="border-white/10 bg-white/10 text-white">{filteredItems.length} visible</Badge>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MiniCard label="Active content" value={activeCount} hint="Currently live" />
                <MiniCard label="Inactive content" value={inactiveCount} hint="Hidden from audience" />
                <MiniCard label="Items with media" value={withMediaCount} hint="Visual content ready" />
                <MiniCard label="Expiring soon" value={expiringSoonCount} hint="Needs review" />
              </CardContent>
            </Card>
            {!prefs.focusMode && (
              <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Activity Feed</CardTitle>
                  <CardDescription className="text-slate-300">The last six admin actions and automation events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activity.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">Try a refresh, copy summary, or bulk edit to populate the feed.</div>
                  ) : activity.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-white">{entry.title}</div>
                        <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{entry.time}</div>
                      </div>
                      <div className="mt-1 text-sm text-slate-300">{entry.detail}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
          <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-white">Workspace Notes</CardTitle>
                <CardDescription className="text-slate-300">These controls are persisted locally, so the page feels like a real operating console.</CardDescription>
              </div>
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={generateBrief}>
                <Wand2 className="h-4 w-4" />
                Generate Brief
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <MiniNote title="Selection aware" value={`${selectedCount} selected`} detail="Bulk actions act on the cards you picked." />
              <MiniNote title="Sorting live" value={sortMode} detail="Use the content board to change the ordering." />
              <MiniNote title="Pref saved" value="localStorage" detail="Your layout and filter choices persist between visits." />
            </CardContent>
          </Card>
          <CommandDeck deck={deck} actions={actions} prefs={prefs} />
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="border-white/10 bg-white/6 backdrop-blur-xl xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Visibility Dashboard</CardTitle>
                <CardDescription className="text-slate-300">
                  Central metrics pulled from the live workspace and activity tables.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MiniCard label="DAU" value={dau} hint="Seen in the last 24h" />
                <MiniCard label="Conversion" value={conversionRate} hint="Active content ratio %" />
                <MiniCard label="Session" value={Number(avgSessionLength.replace("m", "")) || 0} hint="Avg minutes" />
                <MiniCard label="Errors" value={errorCount} hint="Call/session issues" />
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Live Monitoring</CardTitle>
                <CardDescription className="text-slate-300">Recent sessions and active operators.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(callSessions as any[]).slice(0, 4).map((session) => (
                  <div key={session.id} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <span>{session.status}</span>
                      <span className="text-xs text-slate-400">{session.mode}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{session.created_at ? new Date(session.created_at).toLocaleString() : "n/a"}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Feature Flags & Controls</CardTitle>
                <CardDescription className="text-slate-300">
                  Release gradually, section by section.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(featureFlags as any[]).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">
                    No feature flags have been seeded yet.
                  </div>
                ) : (
                  (featureFlags as any[]).map((flag) => (
                    <div key={flag.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-white">{flag.label}</div>
                          <div className="text-xs text-slate-400">{flag.description}</div>
                          <Badge className="mt-2 border-white/10 bg-white/10 text-white">{flag.section}</Badge>
                        </div>
                        <Switch checked={!!flag.enabled} onCheckedChange={(checked) => toggleFeatureFlag(flag.id, checked, flag.flag_key)} />
                      </div>
                      <div className="mt-3 text-xs text-slate-500">Rollout: {flag.rollout_percent ?? 100}%</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Audit Trail</CardTitle>
                <CardDescription className="text-slate-300">
                  Historical actions, who changed what, and the command history.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(auditLogs as any[]).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">
                    Audit logs will appear here as admin actions are performed.
                  </div>
                ) : (
                  (auditLogs as any[]).map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-200">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-white">{entry.action}</span>
                        <span className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {entry.entity_type || "system"} {entry.entity_id ? `• ${entry.entity_id}` : ""}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Operational Console</CardTitle>
              <CardDescription className="text-slate-300">
                One-click maintenance, exports, and safety rails.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => runMaintenanceTask("cache_clear")}>
                Cache clear
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => runMaintenanceTask("queue_rebuild")}>
                Queue rebuild
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => runMaintenanceTask("ingest_sync")}>
                BI ingest sync
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => runMaintenanceTask("mfa_reminder")}>
                MFA reminders
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={importSnapshot}>
                Data import
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {mode === "content" && (
        <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-white">Content Board</CardTitle>
              <CardDescription className="text-slate-300">Review announcements, promotions, and ads from one merged board.</CardDescription>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Search">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, body, tags..." className="border-white/10 bg-black/25 pl-10 text-white placeholder:text-slate-500" />
                </div>
              </Field>
              <Field label="Sort">
                <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
                  <SelectTrigger className="border-white/10 bg-black/25 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="alpha">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Density">
                <Button variant="outline" className="h-10 border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => togglePreference("denseMode")}>
                  {prefs.denseMode ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                  {prefs.denseMode ? "Dense" : "Relaxed"}
                </Button>
              </Field>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/10 bg-white/10 text-white">Visible: {filteredItems.length}</Badge>
              <Badge className="border-white/10 bg-white/10 text-white">Selected: {selectedCount}</Badge>
              <Badge className="border-white/10 bg-white/10 text-white">Active: {activeCount}</Badge>
              <Badge className="border-white/10 bg-white/10 text-white">Media: {withMediaCount}</Badge>
              {!prefs.showInactive && <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">Active only</Badge>}
              {prefs.showMediaOnly && <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-100">Media only</Badge>}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={selectVisible}><CheckSquare className="h-4 w-4" />Select visible</Button>
              <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={clearSelection}><ClipboardCopy className="h-4 w-4" />Clear selection</Button>
              <Button variant="outline" className="border-emerald-400/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15" onClick={() => bulkUpdateActiveState(true)}><Zap className="h-4 w-4" />Activate selected</Button>
              <Button variant="outline" className="border-amber-400/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15" onClick={() => bulkUpdateActiveState(false)}><EyeOff className="h-4 w-4" />Deactivate selected</Button>
              <Button variant="outline" className="border-rose-400/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15" onClick={bulkDelete}><Trash2 className="h-4 w-4" />Delete selected</Button>
            </div>
            <Separator className="bg-white/10" />
            <div className="space-y-6">
              {prefs.groupByType ? (
                (Object.keys(typeMeta) as ContentType[]).map((type) => (
                  <ContentSection
                    key={type}
                    type={type}
                    items={groupedItems[type]}
                    prefs={prefs}
                    selected={selected}
                    creatorNameById={creatorNameById}
                    onToggleSelected={(item) => setSelected((current) => ({ ...current, [selectionKey(item)]: !current[selectionKey(item)] }))}
                    onUpdateAnnouncement={(id, data) => mutationAnnouncement.update(id, data)}
                    onDeleteAnnouncement={(id) => mutationAnnouncement.delete(id)}
                    onUpdatePromotion={(id, data) => mutationPromotion.update(id, data)}
                    onDeletePromotion={(id) => mutationPromotion.delete(id)}
                    onUpdateAd={(id, data) => mutationAd.update(id, data)}
                    onDeleteAd={(id) => mutationAd.delete(id)}
                  />
                ))
              ) : (
                <ContentSection
                  type="announcement"
                  items={filteredItems}
                  prefs={prefs}
                  selected={selected}
                  creatorNameById={creatorNameById}
                  onToggleSelected={(item) => setSelected((current) => ({ ...current, [selectionKey(item)]: !current[selectionKey(item)] }))}
                  onUpdateAnnouncement={(id, data) => mutationAnnouncement.update(id, data)}
                  onDeleteAnnouncement={(id) => mutationAnnouncement.delete(id)}
                  onUpdatePromotion={(id, data) => mutationPromotion.update(id, data)}
                  onDeletePromotion={(id) => mutationPromotion.delete(id)}
                  onUpdateAd={(id, data) => mutationAd.update(id, data)}
                  onDeleteAd={(id) => mutationAd.delete(id)}
                  forceFlat
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{hint}</div>
    </div>
  );
}

function MiniNote({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{title}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{detail}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</Label>
      {children}
    </div>
  );
}

function CommandDeck({
  deck,
  actions,
  prefs,
}: {
  deck: readonly (readonly [string, any, boolean, () => void])[];
  actions: readonly (readonly [string, any, () => void])[];
  prefs: AdminPreferences;
}) {
  return (
    <Card className="border-white/10 bg-white/6 shadow-xl shadow-black/20 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white">
          <Bot className="h-5 w-5 text-fuchsia-300" />
          Command Deck
        </CardTitle>
        <CardDescription className="text-slate-300">20 working controls that reshape the page in real time.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {deck.map(([title, Icon, active, onClick]) => (
          <div
            key={title}
            className={cn(
              "rounded-2xl border p-3 transition-all duration-300",
              prefs.highContrast ? "border-white/18 bg-white/8" : "border-white/10 bg-white/5",
              active ? "shadow-[0_0_0_1px_rgba(34,211,238,0.24)]" : "",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="mt-0.5 rounded-xl border border-white/10 bg-black/20 p-2">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="text-xs leading-5 text-slate-300">{active ? "Enabled" : "Disabled"}</div>
                </div>
              </div>
              <Switch checked={active} onCheckedChange={onClick} />
            </div>
          </div>
        ))}
        {actions.map(([title, Icon, onClick]) => (
          <Button key={title} variant="outline" className="justify-start border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onClick}>
            <Icon className="h-4 w-4" />
            {title}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function ContentSection({
  type,
  items,
  prefs,
  selected,
  creatorNameById,
  onToggleSelected,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onUpdatePromotion,
  onDeletePromotion,
  onUpdateAd,
  onDeleteAd,
  forceFlat = false,
}: {
  type: ContentType;
  items: ContentItem[];
  prefs: AdminPreferences;
  selected: Record<string, boolean>;
  creatorNameById: Map<string, string>;
  onToggleSelected: (item: ContentItem) => void;
  onUpdateAnnouncement: (id: string, data: Partial<any>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onUpdatePromotion: (id: string, data: Partial<any>) => void;
  onDeletePromotion: (id: string) => void;
  onUpdateAd: (id: string, data: Partial<any>) => void;
  onDeleteAd: (id: string) => void;
  forceFlat?: boolean;
}) {
  const meta = typeMeta[type];
  const Icon = meta.icon;
  if (!items.length) {
    return (
      <Card className="border-white/10 bg-black/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Icon className={cn("h-5 w-5", meta.accent)} />
            {meta.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-400">
            No items match the current filters.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-black/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Icon className={cn("h-5 w-5", meta.accent)} />
            {meta.label}
          </CardTitle>
          <Badge className="border-white/10 bg-white/10 text-white">{items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("grid gap-4", forceFlat || prefs.denseMode ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 xl:grid-cols-2")}>
          {items.map((item) => (
            <ContentCard
              key={selectionKey(item)}
              item={item}
              selected={!!selected[selectionKey(item)]}
              prefs={prefs}
              creatorName={item.created_by ? creatorNameById.get(item.created_by) : undefined}
              onToggleSelected={onToggleSelected}
              onUpdateAnnouncement={onUpdateAnnouncement}
              onDeleteAnnouncement={onDeleteAnnouncement}
              onUpdatePromotion={onUpdatePromotion}
              onDeletePromotion={onDeletePromotion}
              onUpdateAd={onUpdateAd}
              onDeleteAd={onDeleteAd}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentCard({
  item,
  selected,
  prefs,
  creatorName,
  onToggleSelected,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onUpdatePromotion,
  onDeletePromotion,
  onUpdateAd,
  onDeleteAd,
}: {
  item: ContentItem;
  selected: boolean;
  prefs: AdminPreferences;
  creatorName?: string;
  onToggleSelected: (item: ContentItem) => void;
  onUpdateAnnouncement: (id: string, data: Partial<any>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onUpdatePromotion: (id: string, data: Partial<any>) => void;
  onDeletePromotion: (id: string) => void;
  onUpdateAd: (id: string, data: Partial<any>) => void;
  onDeleteAd: (id: string) => void;
}) {
  const meta = typeMeta[item.type];
  const Icon = meta.icon;
  const expiringSoon =
    prefs.highlightExpiring &&
    item.type === "promotion" &&
    item.valid_until &&
    new Date(item.valid_until).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 &&
    new Date(item.valid_until).getTime() - Date.now() > 0;

  return (
    <div className="group rounded-3xl border border-white/10 bg-white/6 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/8">
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={() => onToggleSelected(item)} className="mt-1 border-white/30 data-[state=checked]:bg-cyan-400" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("border-white/10 bg-white/10 text-white", meta.accent)}>
              <Icon className="mr-1 h-3.5 w-3.5" />
              {meta.shortLabel}
            </Badge>
            <Badge className={item.is_active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-slate-400/20 bg-slate-500/10 text-slate-200"}>
              {item.is_active ? "Active" : "Inactive"}
            </Badge>
            {expiringSoon && <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-100">Expiring soon</Badge>}
          </div>
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-lg font-bold text-white">{item.title}</h3>
            <p className="line-clamp-3 text-sm leading-6 text-slate-300">{item.content}</p>
          </div>
          <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
            {prefs.showCreators && <MetaRow label="Creator" value={creatorName || "Unknown"} />}
            {prefs.showTimestamps && <MetaRow label="Created" value={new Date(item.created_at).toLocaleDateString()} />}
            {item.type === "promotion" && item.discount_percentage != null && <MetaRow label="Discount" value={`${item.discount_percentage}%`} />}
            {item.type === "promotion" && item.valid_until && <MetaRow label="Valid until" value={new Date(item.valid_until).toLocaleDateString()} />}
            {item.type === "ad" && item.target_audience && <MetaRow label="Audience" value={item.target_audience} />}
            {item.type === "ad" && item.link_url && <MetaRow label="Link" value={item.link_url} />}
          </div>
          {item.media_url && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              {item.media_type?.startsWith("video/") ? (
                <video src={item.media_url} controls className="h-40 w-full object-cover" />
              ) : (
                <img src={item.media_url} alt={item.title} className="h-40 w-full object-cover" />
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() =>
                item.type === "announcement"
                  ? onUpdateAnnouncement(item.id, { is_active: !item.is_active })
                  : item.type === "promotion"
                    ? onUpdatePromotion(item.id, { is_active: !item.is_active })
                    : onUpdateAd(item.id, { is_active: !item.is_active })
              }
            >
              <RefreshCw className="h-4 w-4" />
              Toggle
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-rose-400/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15"
              onClick={() => (item.type === "announcement" ? onDeleteAnnouncement(item.id) : item.type === "promotion" ? onDeletePromotion(item.id) : onDeleteAd(item.id))}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm text-slate-200">{value}</div>
    </div>
  );
}

function UsersPanel({ users, isLoading }: { users: any[]; isLoading: boolean }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user: authUser, startImpersonation, setAdminViewMode, impersonationTarget, readOnlyPreview } = useAuth();
  const updateRole = async (userId: string, role: "admin" | "moderator" | "user") => {
    if (readOnlyPreview) return toast.info("Preview mode is read only");
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert([{ user_id: userId, role }]);
    if (error) {
      toast.error("Failed to update role: " + error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    toast.success("User role updated successfully");
    void (supabase as any).from("admin_audit_logs").insert([{ actor_id: authUser?.id, actor_role: "admin", action: "update_user_role", entity_type: "user", entity_id: userId, details: { role } }]);
  };
  const updateStatus = async (userId: string, status: string) => {
    if (readOnlyPreview) return toast.info("Preview mode is read only");
    const { error } = await (supabase as any).from("profiles").update({ status }).eq("user_id", userId);
    if (error) {
      toast.error("Failed to update status: " + error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    toast.success("User status updated");
    void (supabase as any).from("admin_audit_logs").insert([{ actor_id: authUser?.id, actor_role: "admin", action: "update_user_status", entity_type: "user", entity_id: userId, details: { status } }]);
  };
  const impersonateUser = (userProfile: any) => {
    if (readOnlyPreview) return toast.info("Preview mode is read only");
    startImpersonation({
      userId: userProfile.user_id,
      label: userProfile.display_name || userProfile.username || userProfile.user_id,
    });
    setAdminViewMode("user");
    navigate("/dashboard");
    void (supabase as any).from("admin_audit_logs").insert([{
      actor_id: authUser?.id,
      actor_role: "admin",
      action: "start_impersonation",
      entity_type: "user",
      entity_id: userProfile.user_id,
      details: { label: userProfile.display_name || userProfile.username || userProfile.user_id },
    }]);
  };

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
        <CardContent className="p-6 text-slate-300">Loading users...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/6 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white">User Management</CardTitle>
        <CardDescription className="text-slate-300">Manage roles and inspect user accounts from a cleaner, higher-contrast panel.</CardDescription>
        {readOnlyPreview && <Badge className="mt-2 w-fit border-border bg-secondary text-foreground">Read-only preview</Badge>}
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((userProfile) => (
          <div key={userProfile.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-400/20">
                  {userProfile.avatar_url ? (
                    <img src={userProfile.avatar_url} alt={userProfile.display_name || userProfile.username} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-black text-white">{(userProfile.display_name || userProfile.username || "U")[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">{userProfile.display_name || userProfile.username}</h3>
                  <p className="text-sm text-slate-300">{userProfile.bio || "No bio provided."}</p>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Joined {new Date(userProfile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={userProfile.user_roles?.[0]?.role || "user"}
                  onValueChange={(role) => updateRole(userProfile.user_id, role as "admin" | "moderator" | "user")}
                  disabled={readOnlyPreview}
                >
                  <SelectTrigger className="w-40 border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={userProfile.status || "active"}
                  onValueChange={(status) => updateStatus(userProfile.user_id, status)}
                  disabled={readOnlyPreview}
                >
                  <SelectTrigger className="w-36 border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15"
                  onClick={() => impersonateUser(userProfile)}
                  disabled={readOnlyPreview}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Impersonate
                </Button>
                <Badge className="border-white/10 bg-white/10 text-white">{userProfile.user_roles?.[0]?.role || "user"}</Badge>
                {impersonationTarget?.userId === userProfile.user_id && (
                  <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-100">Previewing</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const mutationAnnouncement = {
  update: async (id: string, data: Partial<any>) => {
    const { error } = await supabase.from("announcements").update(data).eq("id", id);
    if (error) throw error;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) throw error;
  },
};

const mutationPromotion = {
  update: async (id: string, data: Partial<any>) => {
    const { error } = await supabase.from("promotions").update(data).eq("id", id);
    if (error) throw error;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("promotions").delete().eq("id", id);
    if (error) throw error;
  },
};

const mutationAd = {
  update: async (id: string, data: Partial<any>) => {
    const { error } = await supabase.from("ads").update(data).eq("id", id);
    if (error) throw error;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) throw error;
  },
};
