import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User, MapPin, Globe, UserPlus, UserCheck, MessageCircle,
  FolderOpen, Heart, Calendar, ArrowLeft, Music, Image, Video, ExternalLink
} from "lucide-react";

const categoryIcons: Record<string, any> = { music: Music, visual: Image, video: Video, other: FolderOpen };

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId!).single();
      return data;
    },
    enabled: !!userId,
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["follower-count", userId],
    queryFn: async () => {
      const { count } = await supabase.from("connections").select("*", { count: "exact", head: true }).eq("following_id", userId!);
      return count ?? 0;
    },
    enabled: !!userId,
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ["following-count", userId],
    queryFn: async () => {
      const { count } = await supabase.from("connections").select("*", { count: "exact", head: true }).eq("follower_id", userId!);
      return count ?? 0;
    },
    enabled: !!userId,
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ["is-following", userId],
    queryFn: async () => {
      const { data } = await supabase.from("connections").select("id").eq("follower_id", user!.id).eq("following_id", userId!).single();
      return !!data;
    },
    enabled: !!user && !!userId && user.id !== userId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["user-projects", userId],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("user_id", userId!).eq("is_public", true).order("created_at", { ascending: false }).limit(12);
      return data ?? [];
    },
    enabled: !!userId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await supabase.from("connections").delete().eq("follower_id", user!.id).eq("following_id", userId!);
      } else {
        await supabase.from("connections").insert({ follower_id: user!.id, following_id: userId! });
        await supabase.from("notifications").insert({
          user_id: userId!, title: "New Follower", message: `${profile?.display_name || "Someone"} started following you`,
          type: "follow", reference_id: user!.id, reference_type: "user",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", userId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", userId] });
      toast.success(isFollowing ? "Unfollowed" : "Following!");
    },
  });

  const startChat = useMutation({
    mutationFn: async () => {
      const { data: myConvos } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user!.id);
      if (myConvos?.length) {
        for (const mc of myConvos) {
          const { data: other } = await supabase.from("conversation_participants").select("id").eq("conversation_id", mc.conversation_id).eq("user_id", userId!).single();
          if (other) return mc.conversation_id;
        }
      }
      const { data: convo, error } = await supabase.from("conversations").insert({}).select().single();
      if (error) throw error;
      await supabase.from("conversation_participants").insert([
        { conversation_id: convo.id, user_id: user!.id },
        { conversation_id: convo.id, user_id: userId! },
      ]);
      return convo.id;
    },
    onSuccess: () => navigate("/messages"),
    onError: (err: any) => toast.error(err.message),
  });

  const isOwnProfile = user?.id === userId;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="flex items-center gap-4"><div className="w-20 h-20 rounded-full bg-muted" /><div className="space-y-2 flex-1"><div className="h-5 bg-muted rounded w-1/3" /><div className="h-4 bg-muted rounded w-1/4" /></div></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto text-center py-20">
        <User size={48} className="text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold">User not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}><ArrowLeft size={14} className="mr-2" /> Go back</Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft size={14} className="mr-1" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        {/* Profile Header */}
        <Card className="border-border/50 overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/5" />
          <CardContent className="p-5 -mt-12">
            <div className="flex items-end gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-4 ring-background shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="font-display text-xl font-extrabold text-foreground truncate">{profile.display_name || "Artist"}</h1>
                {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
              </div>
            </div>

            {profile.bio && <p className="text-sm text-muted-foreground mb-4">{profile.bio}</p>}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {profile.location && <span className="flex items-center gap-1"><MapPin size={14} /> {profile.location}</span>}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink size={14} /> Website
                </a>
              )}
              <span className="font-medium text-foreground">{followerCount} followers</span>
              <span className="font-medium text-foreground">{followingCount} following</span>
            </div>

            {profile.skills && profile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(profile.skills as string[]).map(s => (
                  <span key={s} className="text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
                ))}
              </div>
            )}

            {profile.genres && profile.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(profile.genres as string[]).map(g => (
                  <span key={g} className="text-[11px] px-2.5 py-1 rounded-full bg-accent/10 text-accent-foreground font-medium">{g}</span>
                ))}
              </div>
            )}

            {!isOwnProfile && user && (
              <div className="flex gap-2">
                <Button variant={isFollowing ? "outline" : "hero"} size="sm" onClick={() => followMutation.mutate()}>
                  {isFollowing ? <><UserCheck size={14} className="mr-1" /> Following</> : <><UserPlus size={14} className="mr-1" /> Follow</>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => startChat.mutate()}>
                  <MessageCircle size={14} className="mr-1" /> Message
                </Button>
              </div>
            )}
            {isOwnProfile && (
              <Button variant="hero-outline" size="sm" onClick={() => navigate("/settings")}>Edit Profile</Button>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <h2 className="font-display text-lg font-bold mb-4">Projects<span className="text-primary">.</span></h2>
        {projects.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {projects.map((p, i) => {
              const CatIcon = categoryIcons[p.category || "other"] || FolderOpen;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="border-border/50 hover:border-primary/20 transition-all overflow-hidden">
                    <div className="h-24 bg-secondary overflow-hidden">
                      {p.cover_url ? <img src={p.cover_url} alt="" className="w-full h-full object-cover" /> : (
                        <div className="w-full h-full flex items-center justify-center"><CatIcon size={24} className="text-muted-foreground/30" /></div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="text-xs font-bold truncate">{p.title}</h3>
                      <p className="text-[10px] text-muted-foreground capitalize">{p.category}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No public projects yet.</p>
        )}
      </motion.div>
    </div>
  );
}
