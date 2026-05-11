import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Verified, Star, TrendingUp, Zap, Heart, Crown } from "lucide-react";

const badgeIcons: Record<string, React.ReactNode> = {
  verified: <Verified className="w-3 h-3" />,
  top_collaborator: <Star className="w-3 h-3" />,
  trending_creator: <TrendingUp className="w-3 h-3" />,
  consistent_contributor: <Zap className="w-3 h-3" />,
  community_helper: <Heart className="w-3 h-3" />,
  master_craftsman: <Crown className="w-3 h-3" />,
  rising_star: <Star className="w-3 h-3" />,
};

const badgeColors: Record<string, string> = {
  verified: "bg-blue-500/20 text-blue-500",
  top_collaborator: "bg-yellow-500/20 text-yellow-500",
  trending_creator: "bg-green-500/20 text-green-500",
  consistent_contributor: "bg-purple-500/20 text-purple-500",
  community_helper: "bg-red-500/20 text-red-500",
  master_craftsman: "bg-yellow-600/20 text-yellow-600",
  rising_star: "bg-pink-500/20 text-pink-500",
};

interface CreatorBadgesDisplayProps {
  userId: string;
  displayType?: 'compact' | 'row' | 'full';
  max?: number;
}

export function CreatorBadgesDisplay({ userId, displayType = 'compact', max = 6 }: CreatorBadgesDisplayProps) {
  const { data: badges = [] } = useQuery({
    queryKey: ["user-badges", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("creator_badges")
        .select("badge_type")
        .eq("user_id", userId);
      return data || [];
    },
    enabled: !!userId,
  });

  if (badges.length === 0) return null;

  const displayBadges = badges.slice(0, max);
  const remaining = badges.length - max;

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayBadges.map((badge: any, idx) => (
        <div
          key={`${badge.badge_type}-${idx}`}
          title={badge.badge_type.replace(/_/g, " ")}
          className={`p-1.5 rounded-full border border-current flex items-center justify-center ${badgeColors[badge.badge_type] || badgeColors.verified}`}
        >
          {badgeIcons[badge.badge_type] || badgeIcons.verified}
        </div>
      ))}
      {remaining > 0 && (
        <div className="text-[10px] px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground font-semibold flex items-center">
          +{remaining}
        </div>
      )}
    </div>
  );
}
