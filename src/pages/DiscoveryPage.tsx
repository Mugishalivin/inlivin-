import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Eye, Sparkles, TrendingUp, Search, User, Users } from "lucide-react";

export default function DiscoveryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recommended");

  // Recommended for you
  const { data: recommendations = [] } = useQuery({
    queryKey: ["discovery", "recommendations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("creator_recommendations")
        .select("*")
        .eq("user_id", user.id)
        .eq("seen", false)
        .order("score", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Trending collections
  const { data: trending = [] } = useQuery({
    queryKey: ["discovery", "trending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("trending_collections")
        .select("*")
        .order("rank", { ascending: true })
        .limit(5);
      return data ?? [];
    },
  });

  // Discover projects
  const { data: projects = [] } = useQuery({
    queryKey: ["discovery", "projects", category, sortBy],
    queryFn: async () => {
      let query = supabase.from("projects").select("*").eq("is_public", true);
      
      if (category !== "all") {
        query = query.eq("category", category);
      }

      if (sortBy === "trending") {
        query = query.order("updated_at", { ascending: false });
      } else if (sortBy === "popular") {
        // In production, sort by likes count
        query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data } = await query.limit(50);
      return data ?? [];
    },
  });

  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    const term = searchTerm.toLowerCase();
    return projects.filter(p => 
      p.title.toLowerCase().includes(term) || 
      p.description?.toLowerCase().includes(term) ||
      p.tags?.some((t: string) => t.toLowerCase().includes(term))
    );
  }, [projects, searchTerm]);

  const renderProjectCard = (project: any) => (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/projects/${project.id}`)}
      className="cursor-pointer"
    >
      <Card className="border-border/50 hover:border-primary/30 overflow-hidden transition-all group h-full">
        <CardContent className="p-0">
          <div className="h-32 bg-secondary relative overflow-hidden">
            {project.cover_url ? (
              <img src={project.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-sm line-clamp-1">{project.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-3">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> 120</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> 24</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 8</span>
            </div>
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {project.tags.slice(0, 2).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          Discover
        </h1>
        <p className="text-muted-foreground mt-2">AI-powered recommendations & trending projects</p>
      </div>

      {/* Trending Collections */}
      {trending.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Trending Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {trending.map((collection: any) => (
              <Card key={collection.id} className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="text-xs text-primary font-bold mb-1">#{collection.rank}</div>
                  <h3 className="font-semibold text-sm">{collection.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{collection.description}</p>
                  <div className="text-xs mt-2">
                    <Badge variant="outline" className="text-[10px]">{collection.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recommended for You */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Made for You
          </h2>
          <p className="text-sm text-muted-foreground">Based on your interests and activity</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 6).map((rec: any) => (
              <Card key={rec.id} className="border-border/50 hover:border-amber-500/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Creator to follow</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                      <Button size="sm" variant="ghost" className="mt-2 h-7">Follow</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Browse & Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h2 className="font-display text-xl font-bold">Explore Projects</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-9 w-full sm:w-40"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="visual">Visual Art</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(renderProjectCard)}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
