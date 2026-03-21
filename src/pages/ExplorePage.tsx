import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Search, MapPin, Filter, UserPlus, UserCheck, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UserAvatar, UserName } from "@/components/UserLink";

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ["explore-artists", search],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .neq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false })
        .limit(20);

      if (search.trim()) {
        query = query.or(
          `display_name.ilike.%${search}%,username.ilike.%${search}%,location.ilike.%${search}%`
        );
      }

      const { data } = await query;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["my-following"],
    queryFn: async () => {
      const { data } = await supabase
        .from("connections")
        .select("following_id")
        .eq("follower_id", user!.id);
      return (data ?? []).map(c => c.following_id);
    },
    enabled: !!user,
  });

  const followMutation = useMutation({
    mutationFn: async (artistUserId: string) => {
      const { error } = await supabase.from("connections").insert({
        follower_id: user!.id,
        following_id: artistUserId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-following"] });
      toast.success("Following!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const unfollowMutation = useMutation({
    mutationFn: async (artistUserId: string) => {
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("follower_id", user!.id)
        .eq("following_id", artistUserId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-following"] });
      toast.success("Unfollowed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const startChat = async (otherUserId: string) => {
    const { data: myConvos } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user!.id);
    if (myConvos?.length) {
      for (const mc of myConvos) {
        const { data: other } = await supabase.from("conversation_participants").select("id").eq("conversation_id", mc.conversation_id).eq("user_id", otherUserId).single();
        if (other) { navigate("/messages"); return; }
      }
    }
    const { data: convo, error } = await supabase.from("conversations").insert({}).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("conversation_participants").insert([
      { conversation_id: convo.id, user_id: user!.id },
      { conversation_id: convo.id, user_id: otherUserId },
    ]);
    navigate("/messages");
  };

  const isFollowing = (userId: string) => following.includes(userId);

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
          Explore<span className="text-primary">.</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Discover artists, producers, and creatives.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or location..."
            className="pl-10 h-11 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
          <Filter size={16} />
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border/50 animate-pulse">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : artists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.map((artist, idx) => (
            <motion.div key={artist.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <Card className="border-border/50 hover:border-primary/20 transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar userId={artist.user_id} avatarUrl={artist.avatar_url} size={12} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-sm text-foreground truncate">
                        <UserName userId={artist.user_id} name={artist.display_name} />
                      </h3>
                      {artist.username && (
                        <p className="text-[11px] text-muted-foreground">@{artist.username}</p>
                      )}
                    </div>
                  </div>

                  {artist.location && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
                      <MapPin size={10} /> {artist.location}
                    </p>
                  )}

                  {artist.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{artist.bio}</p>
                  )}

                  {artist.skills && artist.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(artist.skills as string[]).slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">{s}</span>
                      ))}
                      {(artist.skills as string[]).length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                          +{(artist.skills as string[]).length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    {isFollowing(artist.user_id) ? (
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => unfollowMutation.mutate(artist.user_id)}>
                        <UserCheck size={12} className="mr-1" /> Following
                      </Button>
                    ) : (
                      <Button variant="hero" size="sm" className="flex-1 h-8 text-xs" onClick={() => followMutation.mutate(artist.user_id)}>
                        <UserPlus size={12} className="mr-1" /> Follow
                      </Button>
                    )}
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => startChat(artist.user_id)}>
                      <MessageCircle size={12} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-border/50 border-dashed">
            <CardContent className="py-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <Compass size={28} className="text-accent" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-1">
                {search ? "No artists found" : "Be the first!"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {search ? "Try different keywords or clear the search." : "No other artists have joined yet. Share inlivin with your creative community!"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
