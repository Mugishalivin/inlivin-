import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Megaphone,
  BadgeDollarSign,
  Image as ImageIcon,
  Search,
  Sparkles,
  Star,
  Play,
} from "lucide-react";
import { isVideoMedia, markUpdatesSeen, readUpdatesSeenAt } from "@/lib/update-feed";

type UpdateKind = "all" | "announcement" | "promotion" | "ad";

type UpdateItem = {
  id: string;
  type: Exclude<UpdateKind, "all">;
  title: string;
  content: string;
  created_by?: string | null;
  created_at: string;
  is_active: boolean;
  media_url?: string | null;
  media_type?: string | null;
  discount_percentage?: number | null;
  valid_until?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  target_audience?: string | null;
};

function kindLabel(type: UpdateItem["type"]) {
  if (type === "announcement") return "Announcement";
  if (type === "promotion") return "Promotion";
  return "Ad";
}

function kindIcon(type: UpdateItem["type"]) {
  if (type === "announcement") return Megaphone;
  if (type === "promotion") return BadgeDollarSign;
  return ImageIcon;
}

function kindTone(type: UpdateItem["type"]) {
  if (type === "announcement") return "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300";
  if (type === "promotion") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300";
  return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300";
}

export default function UpdatesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<UpdateKind>("all");
  const [search, setSearch] = useState("");
  const [seenVersion, setSeenVersion] = useState(0);

  useEffect(() => {
    const refreshSeenState = () => setSeenVersion((value) => value + 1);
    window.addEventListener("updates-seen-changed", refreshSeenState);
    return () => window.removeEventListener("updates-seen-changed", refreshSeenState);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    markUpdatesSeen(user.id);
  }, [user?.id]);

  const { data: announcements = [] } = useQuery({
    queryKey: ["updates-announcements"],
    queryFn: async () =>
      (await supabase.from("announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(50)).data ?? [],
    refetchInterval: 15000,
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ["updates-promotions"],
    queryFn: async () =>
      (await supabase.from("promotions").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(50)).data ?? [],
    refetchInterval: 15000,
  });

  const { data: ads = [] } = useQuery({
    queryKey: ["updates-ads"],
    queryFn: async () =>
      (await supabase.from("ads").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(50)).data ?? [],
    refetchInterval: 15000,
  });

  const items = useMemo<UpdateItem[]>(
    () => [
      ...(announcements as any[]).map((item) => ({ ...item, type: "announcement" as const })),
      ...(promotions as any[]).map((item) => ({ ...item, type: "promotion" as const })),
      ...(ads as any[]).map((item) => ({ ...item, type: "ad" as const })),
    ],
    [announcements, promotions, ads],
  );

  const seenAt = readUpdatesSeenAt(user?.id);
  const newCount = useMemo(() => {
    if (!seenAt) return items.length;
    const seenTime = new Date(seenAt).getTime();
    return items.filter((item) => new Date(item.created_at).getTime() > seenTime).length;
  }, [items, seenAt, seenVersion]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTab = tab === "all" ? true : item.type === tab;
      const matchesTerm =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term) ||
        (item.target_audience || "").toLowerCase().includes(term);
      return matchesTab && matchesTerm;
    });
  }, [items, search, tab]);

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <Card className="mb-6 overflow-hidden border-border/70 bg-card/95 shadow-sm backdrop-blur-xl">
        <CardHeader className="relative pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Platform updates
              </div>
              <CardTitle className="text-foreground">Updates feed</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                A visual stream of announcements, promotions, and ads published by admin in real time.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-border bg-background px-3 py-1 text-foreground">
                {newCount > 0 ? `${newCount} new updates` : "All caught up"}
              </Badge>
              <Button variant="outline" className="border-border bg-background hover:bg-secondary" onClick={() => navigate("/feed")}>
                Back to feed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Stat label="Announcements" value={announcements.length} accent="sky" />
          <Stat label="Promotions" value={promotions.length} accent="emerald" />
          <Stat label="Ads" value={ads.length} accent="amber" />
          <Stat label="New updates" value={newCount} accent="violet" />
        </CardContent>
      </Card>

      <div className="mb-5 relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search updates..."
          className="border-border bg-background pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as UpdateKind)}>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-muted-foreground">Browse the latest platform activity in a visual layout.</div>
          <TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-full border border-border bg-background p-1 lg:w-auto">
            <TabsTrigger value="all" className="rounded-full px-4 py-2">
              All
            </TabsTrigger>
            <TabsTrigger value="announcement" className="rounded-full px-4 py-2">
              Announcements
            </TabsTrigger>
            <TabsTrigger value="promotion" className="rounded-full px-4 py-2">
              Promotions
            </TabsTrigger>
            <TabsTrigger value="ad" className="rounded-full px-4 py-2">
              Ads
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={tab} className="mt-0">
          <div className="flex flex-wrap gap-4">
            {filtered.map((item) => (
              <UpdatePinCard
                key={`${item.type}-${item.id}`}
                item={item}
                onOpenDetails={() => navigate(`/content/${item.type}/${item.id}`)}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card/80 p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Star className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No updates found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try a different search or switch to another update type.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UpdatePinCard({
  item,
  onOpenDetails,
}: {
  item: UpdateItem;
  onOpenDetails: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hovered, setHovered] = useState(false);

  const mediaUrl = item.media_url || item.image_url || "";
  const hasMedia = !!mediaUrl;
  const video = isVideoMedia(mediaUrl, item.media_type);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !video) return;

    if (hovered) {
      const playPromise = element.play();
      if (playPromise) {
        playPromise.catch(() => undefined);
      }
      return;
    }

    element.pause();
    element.currentTime = 0;
  }, [hovered, video]);

  const Icon = kindIcon(item.type);

  return (
    <Card
      className="w-full overflow-hidden border-border/70 bg-card/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:basis-[calc(50%-0.5rem)] xl:basis-[calc(33.333%-0.75rem)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${kindTone(item.type)}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenDetails}
          className="group relative block w-full overflow-hidden rounded-[22px] border border-border bg-secondary/40 text-left"
        >
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/30 via-transparent to-black/55 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

          {hasMedia ? video ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <img src={mediaUrl} alt={item.title} className="h-56 w-full object-contain bg-black/5 transition-transform duration-300 group-hover:scale-[1.01]" />
          ) : (
            <div className="flex h-56 w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-background via-secondary/60 to-background p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-border bg-background text-primary shadow-sm">
                <Icon className="h-7 w-7" />
              </div>
              <p className="max-w-xs text-sm text-muted-foreground">This update does not include media yet, but it still appears in the content page.</p>
            </div>
          )}

          <div className="absolute inset-x-0 top-0 z-20 p-4">
            <div className="flex items-start justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75">{kindLabel(item.type)}</p>
                <h3 className="mt-1 line-clamp-2 text-xl font-black leading-tight">{item.title}</h3>
              </div>
              {item.discount_percentage !== null && item.discount_percentage !== undefined && (
                <Badge className="border-0 bg-white/15 text-white backdrop-blur">{item.discount_percentage}%</Badge>
              )}
            </div>
          </div>

          {video && (
            <div className="absolute bottom-4 left-4 z-20 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Play className="h-3.5 w-3.5" />
              Hover to autoplay
            </div>
          )}
        </button>

      </CardContent>
    </Card>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: "sky" | "emerald" | "amber" | "violet" }) {
  const tones = {
    sky: "from-sky-500/10 to-sky-500/5 text-sky-700 dark:text-sky-300",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-700 dark:text-emerald-300",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-700 dark:text-amber-300",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-700 dark:text-violet-300",
  };

  return (
    <div className={`rounded-2xl border border-border bg-gradient-to-br ${tones[accent]} p-4`}>
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-black text-foreground">{value}</div>
    </div>
  );
}
