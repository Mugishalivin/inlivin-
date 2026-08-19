import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CreatorBadge, BADGE_TYPES } from "@/components/CreatorBadges";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Search, User } from "lucide-react";
import { motion } from "framer-motion";

const badgeTypes = BADGE_TYPES;

type BadgeRow = {
  id: string;
  user_id: string;
  badge_type: string;
  reason: string | null;
  level: number | null;
  awarded_at: string | null;
  is_active: boolean | null;
};

export function AdminBadgesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBadgeType, setSelectedBadgeType] = useState("verified");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [level, setLevel] = useState("1");
  const [reason, setReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin_badge_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .order("display_name", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: badges = [], refetch: refetchBadges } = useQuery({
    queryKey: ["admin_badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_badges")
        .select("id, user_id, badge_type, reason, level, awarded_at, is_active")
        .order("awarded_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BadgeRow[];
    },
    refetchInterval: 15000,
  });

  const usersWithBadges = useMemo(() => {
    const grouped = new Map<string, BadgeRow[]>();
    for (const badge of badges) {
      if (badge.is_active === false) continue;
      const list = grouped.get(badge.user_id) ?? [];
      list.push(badge);
      grouped.set(badge.user_id, list);
    }
    const term = searchTerm.trim().toLowerCase();
    return profiles
      .map((profile) => ({
        ...profile,
        name: profile.display_name || profile.username || "Artist",
        badges: grouped.get(profile.user_id) ?? [],
      }))
      .filter((row) =>
        !term ||
        row.name.toLowerCase().includes(term) ||
        (row.username ?? "").toLowerCase().includes(term)
      )
      .sort((a, b) => b.badges.length - a.badges.length);
  }, [profiles, badges, searchTerm]);

  const awardBadgeMutation = useMutation({
    mutationFn: async (payload: { userId: string; badgeType: string; level: number; reason?: string }) => {
      const { error } = await supabase
        .from("creator_badges")
        .insert({
          user_id: payload.userId,
          badge_type: payload.badgeType,
          level: payload.level,
          is_active: true,
          awarded_by: user?.id ?? null,
          awarded_at: new Date().toISOString(),
          reason: payload.reason?.trim() || `Awarded by admin on ${new Date().toLocaleDateString()}`,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Badge awarded", description: "It now shows on the creator's profile." });
      refetchBadges();
      setIsDialogOpen(false);
      setSelectedUserId("");
      setReason("");
      setLevel("1");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message?.includes("duplicate")
          ? "This creator already has that badge."
          : error?.message || "Failed to award badge",
        variant: "destructive",
      });
    },
  });

  const removeBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      const { error } = await supabase.from("creator_badges").delete().eq("id", badgeId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Badge removed" });
      refetchBadges();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to remove badge", variant: "destructive" });
    },
  });

  const openAwardFor = (userId: string) => {
    setSelectedUserId(userId);
    setIsDialogOpen(true);
  };

  const handleAwardBadge = () => {
    if (!selectedUserId || !selectedBadgeType) {
      toast({ title: "Error", description: "Select a creator and a badge type", variant: "destructive" });
      return;
    }
    awardBadgeMutation.mutate({
      userId: selectedUserId,
      badgeType: selectedBadgeType,
      level: Number(level) || 1,
      reason,
    });
  };

  const activeBadges = badges.filter((b) => b.is_active !== false);
  const countOf = (type: string) => activeBadges.filter((b) => b.badge_type === type).length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-primary">Creator Badges</h1>
            <p className="text-sm text-muted-foreground">Award badges — they appear instantly on creator profiles.</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4" /> Award Badge
          </Button>
        </div>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Creator Badge</DialogTitle>
            <DialogDescription>Select a creator, badge type and tier</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Creator</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue placeholder="Select a creator..." /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {usersWithBadges.map((row) => (
                    <SelectItem key={row.user_id} value={row.user_id}>{row.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold">Badge Type</label>
                <Select value={selectedBadgeType} onValueChange={setSelectedBadgeType}>
                  <SelectTrigger><SelectValue placeholder="Badge type..." /></SelectTrigger>
                  <SelectContent>
                    {badgeTypes.map((badge) => (
                      <SelectItem key={badge.value} value={badge.value}>{badge.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold">Tier</label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((l) => (
                      <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold">Reason</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this badge being awarded?"
                rows={3}
              />
            </div>

            <Button
              onClick={handleAwardBadge}
              disabled={!selectedUserId || !selectedBadgeType || awardBadgeMutation.isPending}
              className="w-full"
            >
              {awardBadgeMutation.isPending ? "Awarding..." : "Award Badge"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
      >
        {[
          { label: "Total Creators", value: profiles.length },
          { label: "Badges Awarded", value: activeBadges.length },
          { label: "Verified (Blue)", value: countOf("verified") },
          { label: "Premium (Gold)", value: countOf("premium") },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Creators</CardTitle>
            <CardDescription>Manage badges for every creator</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usersWithBadges.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No creators found</p>
              ) : (
                usersWithBadges.map((row) => (
                  <motion.div
                    key={row.user_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                        {row.avatar_url
                          ? <img src={row.avatar_url} alt={row.name} className="w-full h-full object-cover" />
                          : <User className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{row.name}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {row.badges.length > 0 ? (
                            row.badges.map((badge) => (
                              <div key={badge.id} className="flex items-center gap-1 rounded-full border border-border/60 pl-1 pr-0.5 py-0.5">
                                <CreatorBadge type={badge.badge_type as any} size="sm" />
                                {(badge.level ?? 1) > 1 && (
                                  <span className="text-[10px] text-muted-foreground">L{badge.level}</span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 hover:bg-destructive/20"
                                  onClick={() => removeBadgeMutation.mutate(badge.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">No badges</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openAwardFor(row.user_id)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Badge
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
                    <p className="text-xs text-muted-foreground capitalize">{badge.value.replace(/_/g, " ")}</p>
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

export default AdminBadgesPage;
