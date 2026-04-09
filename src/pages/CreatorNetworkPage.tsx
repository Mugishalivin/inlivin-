import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Users, UserPlus, MessageCircle, Zap, Music, Image as ImageIcon, Video, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { CreatorBadgesRow } from "@/components/CreatorBadges";

export default function CreatorNetworkPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: recommendations = [] } = useQuery({
    queryKey: ["network", "recommendations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("creator_network")
        .select("*")
        .eq("creator_id", user.id)
        .order("compatibility_score", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: trendingCreators = [] } = useQuery({
    queryKey: ["network", "trending-creators"],
    queryFn: async () => {
      const { data } = await supabase
        .from("creator_analytics")
        .select("user_id, trending_rank, total_followers")
        .order("trending_rank", { ascending: true })
        .limit(12);
      
      if (!data?.length) return [];
      
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);
      
      return profiles?.map(p => {
        const stat = data.find(d => d.user_id === p.user_id);
        return { ...p, trending_rank: stat?.trending_rank, followers: stat?.total_followers };
      }) ?? [];
    },
  });

  const { data: connectedUsers = [] } = useQuery({
    queryKey: ["network", "connections", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("creator_network")
        .select("*")
        .eq("creator_id", user.id)
        .eq("connection_type", "collaborator");
      
      if (!data?.length) return [];
      
      const ids = data.map(d => d.connected_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", ids);
      
      return profiles ?? [];
    },
    enabled: !!user,
  });

  const { data: creatorBadges = {} } = useQuery({
    queryKey: ["network", "badges", trendingCreators],
    queryFn: async () => {
      if (!trendingCreators.length) return {};
      const userIds = trendingCreators.map(c => c.user_id);
      const { data: badges } = await supabase
        .from("creator_badges")
        .select("creator_id, badge_type")
        .in("creator_id", userIds);
      
      const badgeMap: Record<string, string[]> = {};
      badges?.forEach(b => {
        if (!badgeMap[b.creator_id]) badgeMap[b.creator_id] = [];
        badgeMap[b.creator_id].push(b.badge_type);
      });
      return badgeMap;
    },
    enabled: trendingCreators.length > 0,
  });

  const followMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      const { error } = await supabase.from("creator_network").insert({
        creator_id: user!.id,
        connected_id: creatorId,
        connection_type: "follow",
        compatibility_score: 0.75,
      }).on("conflict", { ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["network"] });
      toast.success("Following added!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const collaborateMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: creatorId,
        title: "Collaboration Request",
        message: "Someone wants to collaborate with you!",
        type: "collaboration",
        reference_id: user!.id,
        reference_type: "user",
      });
      if (notifError) throw notifError;
    },
    onSuccess: () => {
      toast.success("Collaboration request sent!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "music": return Music;
      case "visual": return ImageIcon;
      case "video": return Video;
      default: return Users;
    }
  };

  const renderCreatorCard = (profile: any, badges?: string[]) => {
    const Icon = getCategoryIcon(profile.category);
    return (
      <motion.div key={profile.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50 hover:border-primary/20 transition-all group">
          <CardContent className="p-4">
            <div className="flex gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{profile.display_name || "Creator"}</h3>
                <p className="text-xs text-muted-foreground">@{profile.username}</p>
                {profile.trending_rank && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                    <TrendingUp className="w-3 h-3" /> #{profile.trending_rank}
                  </div>
                )}
              </div>
            </div>

            {profile.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{profile.bio}</p>}

            {badges && badges.length > 0 && (
              <div className="mb-3">
                <CreatorBadgesRow badges={badges} max={3} />
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              {profile.followers && <span>{profile.followers.toLocaleString()} followers</span>}
              {profile.category && <Badge variant="outline" className="text-[10px] capitalize">{profile.category}</Badge>}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8"
                onClick={() => followMutation.mutate(profile.user_id)}
              >
                <UserPlus className="w-3 h-3 mr-1" /> Follow
              </Button>
              <Button
                size="sm"
                variant="hero"
                className="flex-1 h-8"
                onClick={() => collaborateMutation.mutate(profile.user_id)}
              >
                <Zap className="w-3 h-3 mr-1" /> Collab
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-foreground flex items-center gap-2">
          <Users className="w-8 h-8 text-primary" />
          Creator Network
        </h1>
        <p className="text-muted-foreground mt-2">Find collaborators, connect with creators, and grow your network.</p>
      </div>

      {/* My Collaborators */}
      {connectedUsers.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold">Your Collaborators ({connectedUsers.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedUsers.map(user => (
              <Card key={user.user_id} className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{user.display_name}</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs mt-1"
                        onClick={() => navigate(`/profile/${user.user_id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Collaborators */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold">Recommended for Collaboration</h2>
        <p className="text-sm text-muted-foreground">Creators that match your style and interests</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.slice(0, 6).map((rec: any) => {
            // In a real app, you'd fetch the profile data
            return (
              <Card key={rec.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Collaboration Match</span>
                    <Badge className="bg-primary/70">{(rec.compatibility_score * 100).toFixed(0)}%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Based on shared interests: {rec.shared_interests?.join(", ")}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trending Creators */}
      {trendingCreators.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Trending Creators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingCreators.map(creator => renderCreatorCard(creator, creatorBadges[creator.user_id]))}
          </div>
        </div>
      )}
    </div>
  );
}
