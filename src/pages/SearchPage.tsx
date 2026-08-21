import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Clock,
  FolderOpen,
  MessageCircle,
  Search,
  Sparkles,
  TrendingUp,
  UserPlus,
  UserCheck,
  MapPin,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserAvatar, UserName } from "@/components/UserLink";
import { toast } from "sonner";

const sb = supabase as any;
type Tab = "all" | "people" | "projects" | "posts" | "events";

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  location: string | null;
  bio: string | null;
  skills: string[] | null;
}

export default function SearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("inlivin:recent-searches") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["smart-search", debounced],
    queryFn: async () => {
      const term = debounced.toLowerCase();
      const [[profilesRes, projectsRes, postsRes, eventsRes]] = await Promise.all([
        Promise.all([
          sb.from("profiles").select("user_id, display_name, username, avatar_url, location, bio, skills").neq("user_id", user?.id ?? "").limit(400),
          sb.from("projects").select("id, title, description, tags, cover_url, created_at, user_id").eq("is_public", true).limit(200),
          sb.from("posts").select("id, caption, tags, created_at, user_id").eq("visibility", "public").eq("is_draft", false).limit(200),
          sb.from("events").select("id, user_id, title, description, location, event_date, cover_url, is_virtual").eq("is_public", true).limit(200),
        ]),
      ]);

      const profiles = (profilesRes?.data ?? []) as ProfileRow[];
      const projects = (projectsRes?.data ?? []) as Array<Record<string, any>>;
      const posts = (postsRes?.data ?? []) as Array<Record<string, any>>;
      const events = (eventsRes?.data ?? []) as Array<Record<string, any>>;

      const scoreText = (...parts: Array<string | null | undefined>) => {
        const text = parts.filter(Boolean).join(" ").toLowerCase();
        if (!term) return 0;
        if (text.includes(term)) return 2;
        return 0;
      };

      const people = profiles
        .map((profile) => ({ ...profile, _score: scoreText(profile.display_name, profile.username, profile.location, profile.bio) + ((profile.skills ?? []).join(" ").toLowerCase().includes(term) ? 2 : 0) }))
        .filter((profile) => profile._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 12);

      const filteredProjects = (projects as Array<Record<string, any>>)
        .map((project) => ({ ...project, _score: scoreText(project.title, project.description, (project.tags ?? []).join(" ")) }))
        .filter((project) => project._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 12) as Array<Record<string, any>>;

      const filteredPosts = (posts as Array<Record<string, any>>)
        .map((post) => ({ ...post, _score: scoreText(post.caption, (post.tags ?? []).join(" ")) }))
        .filter((post) => post._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 12) as Array<Record<string, any>>;

      const filteredEvents = (events as Array<Record<string, any>>)
        .map((event) => ({ ...event, _score: scoreText(event.title, event.description, event.location) }))
        .filter((event) => event._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 12) as Array<Record<string, any>>;

      return { people, projects: filteredProjects, posts: filteredPosts, events: filteredEvents };
    },
    enabled: !!user,
    staleTime: 20000,
  });

  const { data: suggestions } = useQuery({
    queryKey: ["search-suggestions", user?.id],
    queryFn: async () => {
      const [peopleRes, projectsRes, eventsRes] = await Promise.all([
        sb.from("profiles").select("user_id, display_name, username, avatar_url, skills").neq("user_id", user?.id ?? "").order("created_at", { ascending: false }).limit(6),
        sb.from("projects").select("id, title, tags, cover_url").eq("is_public", true).order("created_at", { ascending: false }).limit(5),
        sb.from("events").select("id, title, event_date, location, cover_url").eq("is_public", true).gte("event_date", new Date().toISOString()).order("event_date", { ascending: true }).limit(5),
      ]);
      return {
        people: (peopleRes?.data ?? []) as ProfileRow[],
        projects: (projectsRes?.data ?? []) as Array<Record<string, any>>,
        events: (eventsRes?.data ?? []) as Array<Record<string, any>>,
      };
    },
    enabled: !!user && !debounced,
  });

  const saveRecent = (value: string) => {
    const next = [value, ...recent.filter((item) => item !== value)].slice(0, 6);
    setRecent(next);
    try {
      localStorage.setItem("inlivin:recent-searches", JSON.stringify(next));
    } catch {
      /* noop */
    }
  };

  const results = data ?? { people: [], projects: [], posts: [], events: [] };
  const total = results.people.length + results.projects.length + results.posts.length + results.events.length;
  const showSuggestions = !debounced;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">
          Search<span className="text-primary">.</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Find artists, projects, posts and events across inlivin.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && debounced) saveRecent(debounced);
            }}
            placeholder="Search people, projects, posts, events, hashtags..."
            className="h-13 pl-12 pr-12 text-base shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
          </Tabs>
          {debounced && (
            <span className="text-xs text-muted-foreground">
              {total} result{total === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </motion.div>

      <div className="mt-6">
        {isLoading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="animate-pulse"><CardContent className="p-4"><div className="h-5 w-2/3 rounded bg-muted" /><div className="mt-2 h-3 w-1/2 rounded bg-muted" /></CardContent></Card>
            ))}
          </div>
        )}

        {showSuggestions && !isLoading && (
          <div className="space-y-8">
            {recent.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock size={15} className="text-muted-foreground" /> Recent searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setQuery(item);
                        saveRecent(item);
                      }}
                      className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles size={15} className="text-primary" /> Active creators to follow
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(suggestions?.people ?? []).map((person) => (
                  <SuggestionCard key={person.user_id} onClick={() => navigate(`/profile/${person.user_id}`)}>
                    <div className="flex items-center gap-3">
                      <UserAvatar userId={person.user_id} avatarUrl={person.avatar_url} size={10} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-bold text-foreground">
                          <UserName userId={person.user_id} name={person.display_name} />
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {person.skills?.slice(0, 2).join(" · ") || person.username ? `@${person.username}` : "Artist"}
                        </p>
                      </div>
                      <ArrowRight size={15} className="shrink-0 text-muted-foreground" />
                    </div>
                  </SuggestionCard>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <section>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <TrendingUp size={15} className="text-primary" /> Trending projects
                </div>
                <div className="space-y-2.5">
                  {(suggestions?.projects ?? []).map((project) => (
                    <SuggestionCard key={project.id} onClick={() => navigate(`/projects/${project.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                          {project.cover_url ? <img src={project.cover_url} alt="" className="h-full w-full object-cover" /> : <FolderOpen size={16} className="text-muted-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{project.title}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{(project.tags ?? []).slice(0, 2).join(" · ") || "Project"}</p>
                        </div>
                      </div>
                    </SuggestionCard>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Calendar size={15} className="text-primary" /> Upcoming events
                </div>
                <div className="space-y-2.5">
                  {(suggestions?.events ?? []).map((event) => (
                    <SuggestionCard key={event.id} onClick={() => navigate(`/events/${event.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                          {event.cover_url ? <img src={event.cover_url} alt="" className="h-full w-full object-cover" /> : <Calendar size={16} className="text-muted-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {event.event_date ? new Date(event.event_date).toLocaleDateString() : ""}
                            {event.location ? ` · ${event.location}` : ""}
                          </p>
                        </div>
                      </div>
                    </SuggestionCard>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {!showSuggestions && !isLoading && (
          <div className="space-y-6">
            {(tab === "all" || tab === "people") && results.people.length > 0 && (
              <ResultSection title="People">
                {results.people.map((person) => (
                  <PersonRow key={person.user_id} person={person} />
                ))}
              </ResultSection>
            )}
            {(tab === "all" || tab === "projects") && results.projects.length > 0 && (
              <ResultSection title="Projects">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {results.projects.map((project) => (
                    <Card key={project.id} className="cursor-pointer border-border/50 transition-all hover:border-primary/30 hover:shadow-md" onClick={() => { saveRecent(debounced); navigate(`/projects/${project.id}`); }}>
                      <CardContent className="p-4">
                        <div className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                          {project.cover_url ? <img src={project.cover_url} alt={project.title} className="h-full w-full object-cover" /> : <FolderOpen size={22} className="text-muted-foreground" />}
                        </div>
                        <p className="truncate text-sm font-semibold text-foreground">{project.title}</p>
                        {(project.tags ?? []).slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="mt-1.5 mr-1 text-[10px]">#{tag.replace("#", "")}</Badge>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ResultSection>
            )}
            {(tab === "all" || tab === "posts") && results.posts.length > 0 && (
              <ResultSection title="Posts">
                {results.posts.map((post) => (
                  <SuggestionCard key={post.id} onClick={() => { saveRecent(debounced); navigate(`/profile/${post.user_id}`); }}>
                    <p className="line-clamp-1 text-sm text-foreground">{post.caption || "Untitled post"}</p>
                    {(post.tags ?? []).slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="mt-1 mr-1 text-[10px]">#{tag.replace("#", "")}</Badge>
                    ))}
                  </SuggestionCard>
                ))}
              </ResultSection>
            )}
            {(tab === "all" || tab === "events") && results.events.length > 0 && (
              <ResultSection title="Events">
                {results.events.map((event) => (
                  <SuggestionCard key={event.id} onClick={() => { saveRecent(debounced); navigate(`/events/${event.id}`); }}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-foreground">{event.title}</span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar size={11} /> {event.event_date ? new Date(event.event_date).toLocaleDateString() : "TBA"}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin size={11} /> {event.location}
                        </span>
                      )}
                      {event.is_virtual && <Badge variant="outline" className="text-[10px]">Virtual</Badge>}
                    </div>
                  </SuggestionCard>
                ))}
              </ResultSection>
            )}
            {total === 0 && (
              <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center">
                <p className="font-display text-lg font-bold text-foreground">No matches for “{debounced}”</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a different keyword or clear the search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionCard({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.div whileHover={{ y: -1 }} className="cursor-pointer">
      <Card className="border-border/50 transition-colors hover:border-primary/30" onClick={onClick}>
        <CardContent className="p-3.5">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        <span>{title}</span>
        <span className="h-px flex-1 bg-border/60" />
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function PersonRow({ person }: { person: ProfileRow }) {
  const navigate = useNavigate();
  return (
    <motion.div whileHover={{ y: -1 }}>
      <Card className="border-border/50 transition-colors hover:border-primary/30">
        <CardContent className="flex items-center gap-3 p-3.5">
          <UserAvatar userId={person.user_id} avatarUrl={person.avatar_url} size={11} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-foreground">
              <UserName userId={person.user_id} name={person.display_name} />
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {person.username && `@${person.username}`}
              {person.location && person.username ? ` · ${person.location}` : person.location}
            </p>
            {person.skills && person.skills.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {person.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-[9px]">{skill}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate(`/messages?chatWith=${person.user_id}`)}>
              <MessageCircle size={12} className="mr-1" /> Message
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(`/profile/${person.user_id}`)} aria-label="View profile">
              <ArrowRight size={13} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
