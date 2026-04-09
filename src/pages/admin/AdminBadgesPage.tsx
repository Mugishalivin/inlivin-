import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CreatorBadge } from "@/components/CreatorBadges";
import { useToast } from "@/hooks/use-toast";
import { Verified, Flame, TrendingUp, Star, Award, Zap, Plus, Trash2, Search } from "lucide-react";
import { motion } from "framer-motion";

const badgeTypes = [
  { value: "verified", label: "Verified Creator", icon: Verified },
  { value: "top_collaborator", label: "Top Collaborator", icon: Star },
  { value: "trending_creator", label: "Trending Creator", icon: TrendingUp },
  { value: "consistent_contributor", label: "Consistent Contributor", icon: Zap },
  { value: "community_helper", label: "Community Helper", icon: Award },
  { value: "master_craftsman", label: "Master Craftsman", icon: Flame },
  { value: "rising_star", label: "Rising Star", icon: Star }
];

export function AdminBadgesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBadgeType, setSelectedBadgeType] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Query all users with their badges
  const { data: usersWithBadges = [], refetch: refetchUsers } = useQuery({
    queryKey: ["admin_users_badges"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .order("username");

      if (!profiles) return [];

      const usersWithBadgeData = await Promise.all(
        profiles.map(async (profile) => {
          const { data: badges } = await supabase
            .from("creator_badges")
            .select("badge_type, awarded_at")
            .eq("creator_id", profile.id);

          return {
            ...profile,
            badges: (badges || []).map(b => b.badge_type),
            badge_count: badges?.length || 0
          };
        })
      );

      if (searchTerm) {
        return usersWithBadgeData.filter(u => 
          u.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return usersWithBadgeData;
    },
    refetchInterval: 5000
  });

  // Mutation to award badge
  const awardBadgeMutation = useMutation({
    mutationFn: async ({ userId, badgeType, reason }: { userId: string; badgeType: string; reason?: string }) => {
      const { error } = await supabase
        .from("creator_badges")
        .insert({
          creator_id: userId,
          badge_type: badgeType,
          reason: reason || `Awarded by admin on ${new Date().toLocaleDateString()}`
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Badge awarded successfully!" });
      refetchUsers();
      setIsDialogOpen(false);
      setSelectedUserId("");
      setSelectedBadgeType("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to award badge", variant: "destructive" });
    }
  });

  // Mutation to remove badge
  const removeBadgeMutation = useMutation({
    mutationFn: async ({ userId, badgeType }: { userId: string; badgeType: string }) => {
      const { error } = await supabase
        .from("creator_badges")
        .delete()
        .eq("creator_id", userId)
        .eq("badge_type", badgeType);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Badge removed successfully!" });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove badge", variant: "destructive" });
    }
  });

  const handleAwardBadge = () => {
    if (!selectedUserId || !selectedBadgeType) {
      toast({ title: "Error", description: "Please select both a user and badge type", variant: "destructive" });
      return;
    }

    awardBadgeMutation.mutate({
      userId: selectedUserId,
      badgeType: selectedBadgeType
    });
  };

  return (
    <div className="space-y-6 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-semibold text-primary">Creator Badges</h1>
            <p className="text-muted-foreground">Award badges to recognize creator achievements</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Award Badge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Award Creator Badge</DialogTitle>
                <DialogDescription>Select a creator and badge type to award</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Creator</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a creator..." />
                    </SelectTrigger>
                    <SelectContent>
                      {usersWithBadges.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Badge Type</label>
                  <Select value={selectedBadgeType} onValueChange={setSelectedBadgeType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select badge type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {badgeTypes.map((badge) => (
                        <SelectItem key={badge.value} value={badge.value}>
                          {badge.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleAwardBadge}
                  disabled={!selectedUserId || !selectedBadgeType}
                  className="w-full"
                >
                  Award Badge
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search creators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{usersWithBadges.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Badges Awarded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {usersWithBadges.reduce((sum, u) => sum + u.badge_count, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {usersWithBadges.filter(u => u.badges.includes("verified")).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Collaborators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {usersWithBadges.filter(u => u.badges.includes("top_collaborator")).length}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Creators List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Creator Badges</CardTitle>
            <CardDescription>Manage badges for all creators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usersWithBadges.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No creators found</p>
              ) : (
                usersWithBadges.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {user.avatar_url && (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{user.username}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.badges.length > 0 ? (
                            user.badges.map((badge) => (
                              <div key={badge} className="flex items-center gap-1">
                                <CreatorBadge type={badge as any} size="sm" />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 hover:bg-red-500/20"
                                  onClick={() => removeBadgeMutation.mutate({ userId: user.id, badgeType: badge })}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">No badges</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      + Add Badge
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Badge Reference */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Badge Reference</CardTitle>
            <CardDescription>All available badge types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badgeTypes.map((badge) => (
                <div key={badge.value} className="flex items-center gap-3 p-3 rounded-lg border">
                  <CreatorBadge type={badge.value as any} />
                  <div>
                    <p className="font-semibold text-sm">{badge.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {badge.value.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
