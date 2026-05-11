
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Filter,
  Flame,
  Globe,
  Hash,
  Heart,
  ImageIcon,
  LayoutGrid,
  MessageCircle,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { ComponentType, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAvatar, UserName } from "@/components/UserLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SearchSuggestion = {
  type: "tag" | "search" | "title";
  value: string;
  label: string;
  meta: string;
  icon: ComponentType<any>;
};

const marqueeWords = [
  "Bold ideas",
  "Motion first",
  "Fresh pins",
  "Creative energy",
  "Artist spotlight",
  "Color stories",
  "Dream boards",
  "Playful sparks",
];

const discoveryPills = [
  "Cover art",
  "Illustration",
  "Branding",
  "Photography",
  "Motion",
  "UI concepts",
  "Live sets",
  "3D art",
];

export default function FeedPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"latest" | "trending">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["feed-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, description, tags, cover_url, created_at, user_id, is_public")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 60000,
    refetchInterval: 300000,
  });

  const { data: allProjectMeta = [] } = useQuery({
    queryKey: ["feed-project-meta"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, description, tags, cover_url, created_at, user_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(120);
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 60000,
    refetchInterval: 300000,
  });
  const popularTags = useMemo(() => {
    const counts = new Map<string, number>();
    allProjectMeta.forEach((project: any) => {
      (project.tags ?? []).forEach((tag: string) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [allProjectMeta]);

  const topCreators = useMemo(() => {
    const counts = new Map<string, number>();
    const representativeProject = new Map<string, any>();

    allProjectMeta.forEach((project: any) => {
      counts.set(project.user_id, (counts.get(project.user_id) ?? 0) + 1);
      if (!representativeProject.has(project.user_id)) {
        representativeProject.set(project.user_id, project);
      }
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, projectCount]) => ({
        userId,
        projectCount,
        previewProjectId: representativeProject.get(userId)?.id,
      }));
  }, [allProjectMeta]);

  const marqueeSuggestions = useMemo<SearchSuggestion[]>(() => {
    const tagItems = popularTags.map((tag) => ({
      type: "tag" as const,
      value: tag,
      label: `#${tag}`,
      meta: "Popular tag",
      icon: Hash,
    }));

    const searchItems = ["Digital Art", "UI Design", "Animation", "Photography", "Illustration"].map((term) => ({
      type: "search" as const,
      value: term,
      label: term,
      meta: "Hot search",
      icon: Zap,
    }));

    return [...tagItems, ...searchItems];
  }, [popularTags]);

  const dynamicSuggestions = useMemo<SearchSuggestion[]>(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return marqueeSuggestions.slice(0, 8);

    const titleMatches = allProjectMeta
      .filter((project: any) => project.title?.toLowerCase().includes(term))
      .slice(0, 5)
      .map((project: any) => ({
        type: "title" as const,
        value: project.title as string,
        label: project.title as string,
        meta: "Project title match",
        icon: Sparkles,
      }));

    const tagMatches = popularTags
      .filter((tag) => tag.toLowerCase().includes(term))
      .slice(0, 4)
      .map((tag) => ({
        type: "tag" as const,
        value: tag,
        label: `#${tag}`,
        meta: "Tag match",
        icon: Hash,
      }));

    const searchedText = searchQuery.trim();
    const searchItem: SearchSuggestion[] = searchedText
      ? [
          {
            type: "search",
            value: searchedText,
            label: searchedText,
            meta: "Search feed",
            icon: Search,
          },
        ]
      : [];

    const combined = [...searchItem, ...titleMatches, ...tagMatches];
    const seen = new Set<string>();
    return combined
      .filter((item) => {
        const key = `${item.type}:${item.value.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }, [allProjectMeta, marqueeSuggestions, popularTags, searchQuery]);

  const applySuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "tag") {
      setSelectedTagFilter(suggestion.value.replace(/^#/, ""));
      setSearchQuery("");
    } else {
      setSearchQuery(suggestion.value);
      setSelectedTagFilter(null);
    }
    setShowSuggestions(false);
  };

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dynamicSuggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveSuggestionIndex((prev) => (prev + 1) % dynamicSuggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setShowSuggestions(true);
      setActiveSuggestionIndex((prev) => (prev - 1 + dynamicSuggestions.length) % dynamicSuggestions.length);
      return;
    }

    if (event.key === "Enter" && showSuggestions) {
      event.preventDefault();
      const selected = dynamicSuggestions[activeSuggestionIndex];
      if (selected) applySuggestion(selected);
      return;
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const highlightSuggestion = (text: string): ReactNode => {
    const term = searchQuery.trim();
    if (!term) return text;

    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const startIndex = lowerText.indexOf(lowerTerm);
    if (startIndex === -1) return text;

    const before = text.slice(0, startIndex);
    const match = text.slice(startIndex, startIndex + term.length);
    const after = text.slice(startIndex + term.length);

    return (
      <>
        {before}
        <span className="text-primary font-semibold">{match}</span>
        {after}
      </>
    );
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setActiveSuggestionIndex(0);
  }, [searchQuery, dynamicSuggestions.length]);

  const { data: creators = {} } = useQuery({
    queryKey: ["feed-creators", projects.map((p) => p.user_id)],
    queryFn: async () => {
      const userIds = [...new Set(projects.map((p) => p.user_id))];
      const result: Record<string, any> = {};
      for (const uid of userIds) {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, username, user_id")
          .eq("user_id", uid)
          .single();
        result[uid] = data;
      }
      return result;
    },
    enabled: projects.length > 0,
    staleTime: 60000,
    refetchInterval: 300000,
  });

  const { data: myLikes = [] } = useQuery({
    queryKey: ["my-likes"],
    queryFn: async () => {
      const { data } = await supabase.from("likes").select("project_id").eq("user_id", user!.id);
      return (data ?? []).map((l) => l.project_id);
    },
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 120000,
  });

  const { data: likeCounts = {} } = useQuery({
    queryKey: ["feed-like-counts", projects.map((p) => p.id)],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const p of projects) {
        const { count } = await supabase
          .from("likes")
          .select("id", { count: "exact", head: true })
          .eq("project_id", p.id);
        counts[p.id] = count ?? 0;
      }
      return counts;
    },
    enabled: projects.length > 0,
    staleTime: 30000,
    refetchInterval: 180000,
  });

  const { data: myBookmarks = [] } = useQuery({
    queryKey: ["my-bookmarks"],
    queryFn: async () => {
      const { data } = await supabase.from("bookmarks").select("project_id").eq("user_id", user!.id);
      return (data ?? []).map((b) => b.project_id);
    },
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 120000,
  });

  const { data: commentCounts = {} } = useQuery({
    queryKey: ["feed-comment-counts", projects.map((p) => p.id)],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const p of projects) {
        const { count } = await supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("project_id", p.id);
        counts[p.id] = count ?? 0;
      }
      return counts;
    },
    enabled: projects.length > 0,
    staleTime: 30000,
    refetchInterval: 180000,
  });

  const { data: commentsData = [] } = useQuery({
    queryKey: ["feed-comments-for", expandedComments],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("id, project_id, user_id, content, created_at")
        .eq("project_id", expandedComments!)
        .order("created_at", { ascending: true })
        .limit(20);
      const comments = data ?? [];
      const authorIds = [...new Set(comments.map((c) => c.user_id))];
      const profiles: Record<string, any> = {};
      for (const uid of authorIds) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, user_id")
          .eq("user_id", uid)
          .single();
        profiles[uid] = prof;
      }
      return comments.map((c) => ({ ...c, profile: profiles[c.user_id] }));
    },
    enabled: !!expandedComments,
    staleTime: 30000,
  });

  const likeMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (myLikes.includes(projectId)) {
        await supabase.from("likes").delete().eq("user_id", user!.id).eq("project_id", projectId);
      } else {
        await supabase.from("likes").insert({ user_id: user!.id, project_id: projectId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
      queryClient.invalidateQueries({ queryKey: ["feed-like-counts"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (myBookmarks.includes(projectId)) {
        await supabase.from("bookmarks").delete().eq("user_id", user!.id).eq("project_id", projectId);
      } else {
        await supabase.from("bookmarks").insert({ user_id: user!.id, project_id: projectId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookmarks"] });
      toast.success("Updated bookmarks");
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ projectId, content }: { projectId: string; content: string }) => {
      const { error } = await supabase.from("comments").insert({ user_id: user!.id, project_id: projectId, content });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      setCommentText("");
      setCommentingOn(null);
      queryClient.invalidateQueries({ queryKey: ["feed-comment-counts"] });
      queryClient.invalidateQueries({ queryKey: ["feed-comments-for", vars.projectId] });
      toast.success("Comment added!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ commentId, projectId }: { commentId: string; projectId: string }) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user!.id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["feed-comments-for", projectId] });
      queryClient.invalidateQueries({ queryKey: ["feed-comment-counts"] });
      toast.success("Comment deleted");
    },
  });

  const handleShare = (project: any) => {
    navigator.clipboard.writeText(`${window.location.origin}/projects/${project.id}`);
    toast.success("Link copied!");
  };

  const engagementScore = useCallback((projectId: string) => {
    return (likeCounts[projectId] ?? 0) + (commentCounts[projectId] ?? 0) * 2;
  }, [commentCounts, likeCounts]);

  const trendingProjects = [...projects].sort((a, b) => engagementScore(b.id) - engagementScore(a.id));
  const displayProjects = activeTab === "trending" ? trendingProjects : projects;

  const filteredProjects = useMemo(() => {
    const text = searchQuery.trim().toLowerCase();
    return displayProjects.filter((project: any) => {
      const matchesText =
        !text ||
        project.title?.toLowerCase().includes(text) ||
        project.description?.toLowerCase().includes(text) ||
        (project.tags ?? []).some((tag: string) => tag.toLowerCase().includes(text));

      const matchesTag = !selectedTagFilter || (project.tags ?? []).includes(selectedTagFilter);

      return matchesText && matchesTag;
    });
  }, [displayProjects, searchQuery, selectedTagFilter]);

  const topPicks = useMemo(() => {
    return [...filteredProjects]
      .sort((a, b) => engagementScore(b.id) - engagementScore(a.id))
      .slice(0, 3);
  }, [filteredProjects, engagementScore]);

  const topPickIds = new Set(topPicks.map((project) => project.id));

  const feedStats = useMemo(() => {
    const visualPosts = filteredProjects.filter((project: any) => !!project.cover_url).length;
    return [
      { label: "Pins", value: filteredProjects.length, icon: LayoutGrid, note: "Live on the board" },
      { label: "Visual", value: visualPosts, icon: ImageIcon, note: "With cover art" },
      { label: "Hot Tags", value: popularTags.length, icon: Hash, note: "Trending topics" },
      { label: "Creators", value: topCreators.length, icon: Globe, note: "Most active" },
    ];
  }, [filteredProjects, popularTags.length, topCreators.length]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const navigateToProfile = (userId: string) => navigate(`/profile/${userId}`);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTagFilter(null);
    setShowSuggestions(false);
  };

  const openRandomProfile = () => {
    const random = filteredProjects[Math.floor(Math.random() * filteredProjects.length)];
    if (random) navigateToProfile(random.user_id);
  };
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-card via-background to-card p-5 md:p-8 mb-6 shadow-sm"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles size={12} className="text-primary" />
              Creative feed
            </div>

            <h1 className="font-display text-[clamp(2.4rem,6vw,5.1rem)] font-extrabold leading-[0.92] tracking-tight max-w-3xl">
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 18 }}
              >
                Discover a board of
              </motion.span>
              <motion.span
                className="block text-gradient"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 200, damping: 18 }}
              >
                pinworthy projects.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 20 }}
              className="max-w-2xl text-sm md:text-base text-muted-foreground"
            >
              Browse creator profiles, catch fresh ideas, and move through the feed like a living mood board.
            </motion.p>

            <div className="flex flex-wrap gap-2">
              <Button variant="hero" size="sm" onClick={() => setActiveTab("trending")}> 
                <Flame size={14} className="mr-1" /> Trending board
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <RefreshCcw size={14} className="mr-1" /> Reset filters
              </Button>
              <Button variant="outline" size="sm" onClick={openRandomProfile} disabled={!filteredProjects.length}>
                <ArrowRight size={14} className="mr-1" /> Surprise me
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-border/60 bg-background/75 p-4 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Search board</p>
                <Filter size={14} className="text-muted-foreground" />
              </div>
              <div ref={searchBoxRef} className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search projects, tags, or vibes..."
                  className="h-11 rounded-2xl pl-10 pr-4 bg-background/90"
                />

                <AnimatePresence>
                  {showSuggestions && dynamicSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl"
                    >
                      <div className="p-2">
                        {dynamicSuggestions.map((suggestion, idx) => {
                          const Icon = suggestion.icon;
                          const active = idx === activeSuggestionIndex;
                          return (
                            <motion.button
                              key={`${suggestion.type}-${suggestion.value}`}
                              whileHover={{ x: 4 }}
                              type="button"
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                                active ? "bg-primary/10" : "hover:bg-secondary"
                              }`}
                              onClick={() => applySuggestion(suggestion)}
                            >
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-border">
                                <Icon size={15} className="text-primary" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-foreground">{highlightSuggestion(suggestion.label)}</span>
                                <span className="block text-[11px] text-muted-foreground">{suggestion.meta}</span>
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="feed-marquee overflow-hidden rounded-3xl border border-border/60 bg-background/70 py-3">
              <div className="feed-marquee-track flex w-max items-center gap-3 px-3">
                {[...marqueeWords, ...marqueeWords].map((word, idx) => (
                  <span
                    key={`${word}-${idx}`}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground shadow-sm"
                  >
                    <Sparkles size={13} className="text-primary" />
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 170, damping: 20 }}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-6"
      >
        {feedStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
            >
              <Card className="overflow-hidden border-border/60 bg-card/90">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon size={18} />
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      0{idx + 1}
                    </span>
                  </div>
                  <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-sm font-medium text-foreground mt-1">{stat.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.note}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px] mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 20 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              whileHover={{ y: -2 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "latest"
                  ? "bg-foreground text-background shadow-md"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("latest")}
            >
              <Globe size={14} className="inline mr-1.5" /> Latest
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "trending"
                  ? "bg-foreground text-background shadow-md"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("trending")}
            >
              <Flame size={14} className="inline mr-1.5" /> Trending
            </motion.button>

            {popularTags.slice(0, 6).map((tag) => {
              const active = selectedTagFilter === tag;
              return (
                <motion.button
                  key={tag}
                  whileHover={{ y: -2, scale: 1.02 }}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                  onClick={() => setSelectedTagFilter(active ? null : tag)}
                >
                  #{tag}
                </motion.button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {topCreators.map((creator) => {
              const profile = creators[creator.userId];
              const creatorName = profile?.display_name || "Artist";
              const creatorInitial = creatorName.charAt(0).toUpperCase();
              return (
                <motion.button
                  key={creator.userId}
                  whileHover={{ y: -4 }}
                  className="rounded-3xl border border-border/60 bg-card/90 p-4 text-left shadow-sm transition-shadow hover:shadow-md"
                  onClick={() => navigateToProfile(creator.userId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 overflow-hidden rounded-full bg-secondary ring-2 ring-border flex items-center justify-center shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">{creatorInitial}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{creatorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {creator.projectCount} public project{creator.projectCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, type: "spring", stiffness: 180, damping: 20 }}
          className="rounded-[1.75rem] border border-border/60 bg-card/90 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-lg font-bold">Quick Picks</h2>
              <p className="text-xs text-muted-foreground">Fast ways to reshape the board.</p>
            </div>
            <Sparkles size={16} className="text-primary" />
          </div>

          <div className="space-y-2">
            {discoveryPills.map((pill) => (
              <motion.button
                key={pill}
                whileHover={{ x: 4 }}
                className="flex w-full items-center justify-between rounded-2xl border border-border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-secondary"
                onClick={() => setSearchQuery(pill)}
              >
                <span>{pill}</span>
                <ArrowRight size={14} className="text-muted-foreground" />
              </motion.button>
            ))}
          </div>

          <div className="section-divider my-4" />

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Popular suggestions</p>
            <div className="flex flex-wrap gap-2">
              {marqueeSuggestions.slice(0, 8).map((suggestion) => (
                <motion.button
                  key={`${suggestion.type}-${suggestion.value}`}
                  whileHover={{ y: -2, scale: 1.03 }}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                  onClick={() => applySuggestion(suggestion)}
                >
                  {suggestion.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.aside>
      </section>

      {isLoading ? (
        <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="mb-4 break-inside-avoid overflow-hidden border-border/50 animate-pulse">
              <CardContent className="p-0">
                <div className="h-72 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
          <AnimatePresence>
            {filteredProjects.map((project, idx) => {
              const creator = creators[project.user_id];
              const liked = myLikes.includes(project.id);
              const bookmarked = myBookmarks.includes(project.id);
              const lc = likeCounts[project.id] ?? 0;
              const cc = commentCounts[project.id] ?? 0;
              const showComments = expandedComments === project.id;
              const isTopPick = topPickIds.has(project.id);

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.98 }}
                  transition={{
                    delay: idx * 0.04,
                    type: "spring",
                    stiffness: 220,
                    damping: 24,
                  }}
                  className="mb-4 break-inside-avoid"
                >
                  <Card
                    role="link"
                    tabIndex={0}
                    aria-label={`Open ${project.title} creator profile`}
                    onClick={() => navigateToProfile(project.user_id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigateToProfile(project.user_id);
                      }
                    }}
                    className="group cursor-pointer overflow-hidden rounded-[1.75rem] border-border/70 bg-card/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <CardContent className="p-0">
                      <div className="relative">
                        <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
                          <div className="rounded-full bg-black/45 px-2.5 py-1.5 backdrop-blur-md">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigateToProfile(project.user_id);
                              }}
                              className="flex items-center gap-2"
                            >
                              <div className="h-6 w-6 overflow-hidden rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/20">
                                {creator?.avatar_url ? (
                                  <img src={creator.avatar_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-semibold text-white">
                                    {(creator?.display_name || "Artist").charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-semibold text-white">
                                {creator?.display_name || "Artist"}
                              </span>
                            </button>
                          </div>
                          <div className="rounded-full bg-black/45 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                            {timeAgo(project.created_at)}
                          </div>
                        </div>

                        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
                          {isTopPick && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-lg">
                              <Flame size={11} /> Hot
                            </span>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(event) => event.stopPropagation()}
                                className="h-8 w-8 rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/45"
                              >
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleShare(project);
                                }}
                              >
                                <Share2 size={14} className="mr-2" /> Share
                              </DropdownMenuItem>
                              {project.user_id === user?.id && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toast("Delete your own project from the Projects page.", {
                                      description: "This feed card is focused on profile discovery.",
                                    });
                                  }}
                                >
                                  <Trash2 size={14} className="mr-2" /> Remove
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div
                          className="relative min-h-[240px] overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {project.cover_url ? (
                            <img
                              src={project.cover_url}
                              alt={project.title}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                            />
                          ) : (
                            <div className="flex min-h-[240px] items-center justify-center p-8">
                              <div className="text-center">
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-background/80 shadow-md">
                                  <ImageIcon size={34} className="text-primary" />
                                </div>
                                <p className="font-display text-lg font-bold text-foreground">{project.title}</p>
                                <p className="mt-1 text-xs text-muted-foreground">Pin-ready concept board</p>
                              </div>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-80" />
                        </div>

                        <div className="relative z-10 -mt-10 px-4 pb-4">
                          <div className="rounded-[1.5rem] border border-border/60 bg-background/90 p-4 shadow-lg backdrop-blur">
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="font-display text-lg font-bold leading-tight text-foreground line-clamp-2">
                                  {project.title}
                                </h3>
                                {project.description && (
                                  <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                                    {project.description}
                                  </p>
                                )}
                              </div>
                              <motion.div whileHover={{ rotate: -8, scale: 1.05 }} className="shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-full border border-border bg-background/80"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    navigateToProfile(project.user_id);
                                  }}
                                >
                                  <ArrowRight size={14} />
                                </Button>
                              </motion.div>
                            </div>

                            {project.tags && (project.tags as string[]).length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-2">
                                {(project.tags as string[]).map((tag) => (
                                  <motion.button
                                    key={tag}
                                    whileHover={{ y: -2, scale: 1.03 }}
                                    type="button"
                                    className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/15"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedTagFilter(tag);
                                    }}
                                  >
                                    #{tag}
                                  </motion.button>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between border-t border-border/60 pt-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-9 rounded-full px-3 text-xs gap-1.5 ${liked ? "text-destructive" : ""}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    likeMutation.mutate(project.id);
                                  }}
                                >
                                  <motion.div animate={liked ? { scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.28 }}>
                                    <Heart size={15} fill={liked ? "currentColor" : "none"} />
                                  </motion.div>
                                  {lc > 0 && lc}
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 rounded-full px-3 text-xs gap-1.5"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setExpandedComments(showComments ? null : project.id);
                                    setCommentingOn(showComments ? null : project.id);
                                  }}
                                >
                                  <MessageCircle size={15} />
                                  {cc > 0 && cc}
                                </Button>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 rounded-full px-3 text-xs gap-1.5"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleShare(project);
                                  }}
                                >
                                  <Share2 size={15} />
                                  Share
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-9 w-9 rounded-full ${bookmarked ? "text-primary" : ""}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    bookmarkMutation.mutate(project.id);
                                  }}
                                >
                                  {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                                </Button>
                              </div>
                            </div>

                            <AnimatePresence>
                              {showComments && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <div className="pt-4 space-y-3">
                                    {commentsData.length > 0 && (
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {commentsData.map((comment) => (
                                          <div key={comment.id} className="flex gap-2 group/comment">
                                            <UserAvatar
                                              userId={comment.user_id}
                                              avatarUrl={comment.profile?.avatar_url}
                                              size={7}
                                            />
                                            <div className="flex-1 rounded-2xl bg-secondary/60 px-3 py-2">
                                              <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs font-medium">
                                                  <UserName
                                                    userId={comment.user_id}
                                                    name={comment.profile?.display_name}
                                                    className="pointer-events-none"
                                                  />
                                                </p>
                                                {comment.user_id === user!.id && (
                                                  <button
                                                    className="opacity-0 transition-opacity text-destructive hover:text-destructive/80 group-hover/comment:opacity-100"
                                                    onClick={(event) => {
                                                      event.stopPropagation();
                                                      deleteCommentMutation.mutate({
                                                        commentId: comment.id,
                                                        projectId: project.id,
                                                      });
                                                    }}
                                                  >
                                                    <Trash2 size={12} />
                                                  </button>
                                                )}
                                              </div>
                                              <p className="text-xs text-muted-foreground">{comment.content}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <form
                                      className="flex gap-2"
                                      onSubmit={(event) => {
                                        event.preventDefault();
                                        if (commentText.trim()) {
                                          commentMutation.mutate({
                                            projectId: project.id,
                                            content: commentText.trim(),
                                          });
                                        }
                                      }}
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      <Input
                                        value={commentingOn === project.id ? commentText : ""}
                                        onChange={(event) => {
                                          setCommentText(event.target.value);
                                          setCommentingOn(project.id);
                                        }}
                                        placeholder="Write a comment..."
                                        className="h-9 flex-1 rounded-full text-sm"
                                        autoFocus
                                      />
                                      <Button variant="hero" size="icon" className="h-9 w-9 shrink-0 rounded-full" type="submit">
                                        <Send size={14} />
                                      </Button>
                                    </form>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-[2rem] border border-dashed border-border bg-card/85 p-10 text-center shadow-sm"
        >
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{ y: [0, -12, 0], x: [0, 6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-8 top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
            />
            <motion.div
              animate={{ y: [0, 14, 0], x: [0, -8, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-6 right-10 h-28 w-28 rounded-full bg-accent/10 blur-2xl"
            />
          </div>

          <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-background shadow-md">
            <motion.div
              animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles size={34} className="text-primary" />
            </motion.div>
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            No pins match this vibe yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Try a different keyword or tag, or clear the filters and let the board breathe again.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="hero" onClick={clearFilters}>
              Clear filters
            </Button>
            <Button variant="outline" onClick={() => setShowSuggestions(true)}>
              <Search size={14} className="mr-1" /> Search again
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
