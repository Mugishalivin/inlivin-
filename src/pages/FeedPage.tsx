import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  FileText,
  Globe,
  ImageIcon,
  Hash,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FeedKind = "post" | "project";
type FeedItem = {
  id: string;
  kind: FeedKind;
  title: string;
  body: string | null;
  image: string | null;
  created_at: string;
  user_id: string;
  tags: string[];
  textStyle: {
    theme: TextTheme;
    align: TextAlign;
    size: TextSize;
  };
  group: string;
  score: number;
};

const sb = supabase as any;
type TextTheme = "sunset" | "ocean" | "ink" | "fresh" | "paper" | "royal";
type TextAlign = "left" | "center" | "right";
type TextSize = "sm" | "md" | "lg";

const textThemes: Record<TextTheme, string> = {
  sunset: "bg-gradient-to-br from-primary via-rose-500 to-accent text-primary-foreground",
  ocean: "bg-gradient-to-br from-accent via-cyan-600 to-primary text-white",
  ink: "bg-foreground text-background",
  fresh: "bg-gradient-to-br from-emerald-500 via-accent to-primary text-white",
  paper: "bg-secondary text-secondary-foreground",
  royal: "bg-gradient-to-br from-violet-600 via-primary to-fuchsia-600 text-white",
};

const textAlignClasses: Record<TextAlign, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
};

const textSizeClasses: Record<TextSize, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

const getPostStyle = (tags: string[] = []) => {
  const read = (prefix: string) => tags.find((tag) => tag.startsWith(prefix))?.replace(prefix, "");
  const theme = (read("_style:") || "sunset") as TextTheme;
  const align = (read("_align:") || "center") as TextAlign;
  const size = (read("_size:") || "md") as TextSize;
  return {
    theme: textThemes[theme] ? theme : "sunset",
    align: textAlignClasses[align] ? align : "center",
    size: textSizeClasses[size] ? size : "md",
  };
};

const publicTags = (tags: string[] = []) => tags.filter((tag) => !tag.startsWith("_"));

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
  return new Date(date).toLocaleDateString();
};

const splitTitleFromCaption = (caption: string | null) => {
  const text = caption?.trim() || "";
  if (!text) return { title: "Untitled post", body: null };
  const [first, ...rest] = text.split(/\n\s*\n/);
  if (rest.length === 0) return { title: first.slice(0, 80), body: text };
  return { title: first.slice(0, 80), body: rest.join("\n\n") };
};

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeKind, setActiveKind] = useState<"all" | FeedKind | "media" | "mine">("all");
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dynamic-feed", user?.id],
    queryFn: async () => {
      const [{ data: projects = [] }, postsResult] = await Promise.all([
        supabase
          .from("projects")
          .select("id, title, description, tags, cover_url, created_at, user_id, is_public")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(80),
        sb
          .from("posts")
          .select("*")
          .eq("visibility", "public")
          .eq("is_draft", false)
          .order("created_at", { ascending: false })
          .limit(80),
      ]);

      const posts = postsResult?.data ?? [];
      const postIds = posts.map((post: any) => post.id);
      const postUserIds = posts.map((post: any) => post.user_id);
      const projectUserIds = (projects ?? []).map((project: any) => project.user_id);
      const userIds = [...new Set([...postUserIds, ...projectUserIds].filter(Boolean))];

      const [{ data: profiles = [] }, { data: media = [] }, { data: likes = [] }, { data: comments = [] }] = await Promise.all([
        userIds.length
          ? supabase.from("profiles").select("user_id, display_name, username, avatar_url").in("user_id", userIds)
          : Promise.resolve({ data: [] }),
        postIds.length ? sb.from("post_media").select("*").in("post_id", postIds).order("display_order") : Promise.resolve({ data: [] }),
        postIds.length ? sb.from("post_likes").select("post_id").in("post_id", postIds) : Promise.resolve({ data: [] }),
        postIds.length ? sb.from("post_comments").select("post_id").in("post_id", postIds) : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile]));
      const mediaMap = new Map<string, any[]>();
      (media ?? []).forEach((item: any) => {
        const current = mediaMap.get(item.post_id) || [];
        current.push(item);
        mediaMap.set(item.post_id, current);
      });
      const likeCount = new Map<string, number>();
      (likes ?? []).forEach((like: any) => likeCount.set(like.post_id, (likeCount.get(like.post_id) || 0) + 1));
      const commentCount = new Map<string, number>();
      (comments ?? []).forEach((comment: any) => commentCount.set(comment.post_id, (commentCount.get(comment.post_id) || 0) + 1));

      const postItems: FeedItem[] = posts.map((post: any) => {
        const parsed = splitTitleFromCaption(post.caption);
        const firstMedia = mediaMap.get(post.id)?.[0];
        const tags = post.tags || [];
        return {
          id: post.id,
          kind: "post",
          title: parsed.title,
          body: parsed.body,
          image: firstMedia?.media_url || null,
          created_at: post.created_at,
          user_id: post.user_id,
          tags: publicTags(tags),
          textStyle: getPostStyle(tags),
          group: post.post_type === "announcement" ? "Announcements" : post.post_type === "reel" ? "Reels" : post.post_type === "story" ? "Stories" : firstMedia ? "Visual Posts" : "Text Posts",
          score: (likeCount.get(post.id) || 0) + (commentCount.get(post.id) || 0) * 2,
        };
      });

      const projectItems: FeedItem[] = (projects ?? []).map((project: any) => ({
        id: project.id,
        kind: "project",
        title: project.title || "Untitled project",
        body: project.description || null,
        image: project.cover_url || null,
        created_at: project.created_at,
        user_id: project.user_id,
        tags: project.tags || [],
        textStyle: { theme: "paper", align: "center", size: "md" },
        group: project.cover_url ? "Visual Projects" : "Project Notes",
        score: (project.tags?.length || 0) + (project.cover_url ? 3 : 0),
      }));

      return {
        items: [...postItems, ...projectItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        profiles: Object.fromEntries((profiles ?? []).map((profile: any) => [profile.user_id, profile])),
      };
    },
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 120000,
  });

  const allItems = data?.items ?? [];
  const profiles = data?.profiles ?? {};

  const popularGroups = useMemo(() => {
    const counts = new Map<string, number>();
    allItems.forEach((item) => counts.set(item.group, (counts.get(item.group) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [allItems]);

  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    allItems.forEach((item) => item.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag]) => tag);
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const text = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesKind =
        activeKind === "all" ||
        item.kind === activeKind ||
        (activeKind === "media" && !!item.image) ||
        (activeKind === "mine" && item.user_id === user?.id);
      const matchesGroup = !selectedGroup || item.group === selectedGroup;
      const matchesText =
        !text ||
        item.title.toLowerCase().includes(text) ||
        item.body?.toLowerCase().includes(text) ||
        item.tags.some((tag) => tag.toLowerCase().includes(text)) ||
        profiles[item.user_id]?.display_name?.toLowerCase().includes(text);
      return matchesKind && matchesGroup && matchesText;
    });
  }, [activeKind, allItems, profiles, query, selectedGroup, user?.id]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, FeedItem[]>();
    filteredItems.forEach((item) => {
      const group = groups.get(item.group) || [];
      group.push(item);
      groups.set(item.group, group);
    });
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [filteredItems]);

  const trendingItems = [...filteredItems].sort((a, b) => b.score - a.score).slice(0, 4);

  const openItem = (item: FeedItem) => {
    if (item.kind === "project") navigate(`/projects/${item.id}`);
    else navigate(`/profile/${item.user_id}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm md:p-8"
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm text-muted-foreground md:text-base">
                Explore new posts, projects, visuals, and creator updates in one organized stream.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate("/posts")}>
                <Plus className="h-4 w-4" />
                New post
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCcw className="h-4 w-4" />
                Update feed
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-border bg-background p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search creators, tags, posts, or projects"
                className="h-11 border-0 bg-secondary pl-9 focus-visible:ring-1"
              />
            </div>
            <Tabs value={activeKind} onValueChange={(value) => setActiveKind(value as typeof activeKind)}>
              <TabsList className="grid grid-cols-5 bg-secondary">
                <TabsTrigger value="all">For you</TabsTrigger>
                <TabsTrigger value="post">Posts</TabsTrigger>
                <TabsTrigger value="project">Projects</TabsTrigger>
                <TabsTrigger value="media">Visuals</TabsTrigger>
                <TabsTrigger value="mine">Mine</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </motion.section>

      <div className="flex flex-wrap gap-2">
        {popularGroups.map(([group, count]) => (
          <Button
            key={group}
            variant={selectedGroup === group ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedGroup(selectedGroup === group ? null : group)}
          >
            {group}
            <Badge variant="secondary" className="ml-1">{count}</Badge>
          </Button>
        ))}
      </div>

      {popularTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(tag)}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-primary/10 hover:text-primary"
            >
              <Hash className="h-3 w-3" />
              {tag}
            </button>
          ))}
        </div>
      )}

      {trendingItems.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">Trending Now</h2>
              <p className="text-sm text-muted-foreground">Highest activity and richest metadata.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {trendingItems.map((item) => (
              <FeedCard key={`${item.kind}-${item.id}`} item={item} profile={profiles[item.user_id]} compact onOpen={() => openItem(item)} />
            ))}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : groupedItems.length > 0 ? (
        <div className="space-y-8">
          {groupedItems.map(([group, items]) => (
            <section key={group} className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold">{group}</h2>
                  <p className="text-sm text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"} in this group</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedGroup(group)}>
                  View group
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <FeedCard key={`${item.kind}-${item.id}`} item={item} profile={profiles[item.user_id]} onOpen={() => openItem(item)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border bg-card">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Sparkles className="mb-4 h-10 w-10 text-primary" />
            <h3 className="font-display text-xl font-bold">No feed items match</h3>
            <p className="mt-1 text-sm text-muted-foreground">Clear filters or create a new post to get the board moving.</p>
            <Button className="mt-5" onClick={() => navigate("/posts")}>Create post</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeedCard({ item, profile, onOpen, compact = false }: { item: FeedItem; profile: any; onOpen: () => void; compact?: boolean }) {
  const displayName = profile?.display_name || profile?.username || "Creator";
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className={`relative bg-muted ${compact ? "aspect-[4/3]" : "aspect-video"}`}>
          {item.image ? (
            item.group === "Reels" ? (
              <video src={item.image} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" muted playsInline />
            ) : (
              <img src={item.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            )
          ) : (
            item.kind === "post" ? (
              <div className={`flex h-full justify-center p-5 ${textThemes[item.textStyle.theme]} ${textAlignClasses[item.textStyle.align]}`}>
                <div className="max-w-[92%]">
                  <p className={`font-display font-extrabold leading-tight ${textSizeClasses[item.textStyle.size]}`}>{item.title}</p>
                  {item.body && <p className="mt-2 line-clamp-3 text-xs opacity-90">{item.body}</p>}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
                <ImageIcon className="h-10 w-10 text-primary" />
              </div>
            )
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge className="capitalize">{item.kind}</Badge>
            <Badge variant="secondary">{timeAgo(item.created_at)}</Badge>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-secondary">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{item.group}</p>
            </div>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold leading-tight line-clamp-2">{item.title}</h3>
            {item.body && <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{item.body}</p>}
          </div>
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(item.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1 font-semibold text-primary">
              Open
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </button>
    </motion.article>
  );
}
