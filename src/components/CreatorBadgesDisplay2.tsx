import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Verified, Flame, TrendingUp, Star, Award, Zap, Heart, Crown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const badgeIcons: Record<string, React.ReactNode> = {
  verified: <Verified className="w-4 h-4" />,
  top_collaborator: <Star className="w-4 h-4" />,
  trending_creator: <TrendingUp className="w-4 h-4" />,
  consistent_contributor: <Zap className="w-4 h-4" />,
  community_helper: <Heart className="w-4 h-4" />,
  master_craftsman: <Crown className="w-4 h-4" />,
  rising_star: <Star className="w-4 h-4" />,
};

const badgeLabels: Record<string, string> = {
  verified: "Verified Creator",
  top_collaborator: "Top Collaborator",
  trending_creator: "Trending Creator",
  consistent_contributor: "Consistent Contributor",
  community_helper: "Community Helper",
  master_craftsman: "Master Craftsman",
  rising_star: "Rising Star",
};

const badgeColors: Record<string, string> = {
  verified: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  top_collaborator: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  trending_creator: "bg-green-500/20 text-green-500 border-green-500/30",
  consistent_contributor: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  community_helper: "bg-red-500/20 text-red-500 border-red-500/30",
  master_craftsman: "bg-yellow-600/20 text-yellow-600 border-yellow-600/30",
  rising_star: "bg-pink-500/20 text-pink-500 border-pink-500/30",
};

interface CreatorBadgesDisplayProps {
  userId: string;
  displayType?: 'compact' | 'row' | 'full';
  max?: number;
}

export function CreatorBadgesDisplay({ userId, displayType = 'compact', max = 5 }: CreatorBadgesDisplayProps) {
  const { data: badges = [] } = useQuery({
    queryKey: ["creator-badges-display", userId],
    queryFn: async () => {
      try {
        const { data: badgeData, error } = await supabase
          .from("creator_badges")
          .select("badge_type")
          .eq("user_id", userId);

        if (error) {
          console.error("Badge query error:", error);
          return [];
        }

        return badgeData || [];
      } catch (err) {
        console.error("Error fetching creator badges:", err);
        return [];
      }
    },
    enabled: !!userId,
  });

  if (!badges || badges.length === 0) return null;

  const badgeTypes = badges.map((b: any) => b.badge_type).filter(Boolean);
  const displayBadges = badgeTypes.slice(0, max);
  const remaining = Math.max(0, badgeTypes.length - max);

  if (displayType === 'row' || displayType === 'compact') {
    return (
      <div className="flex flex-wrap gap-1">
        <TooltipProvider>
          {displayBadges.map((badgeType: string) => (
            <Tooltip key={badgeType}>
              <TooltipTrigger asChild>
                <div className={`p-1.5 rounded-full border cursor-help ${badgeColors[badgeType] || badgeColors.verified}`}>
                  {badgeIcons[badgeType] || badgeIcons.verified}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs font-semibold">{badgeLabels[badgeType] || badgeType}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
        {remaining > 0 && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground font-semibold">
            +{remaining}
          </span>
        )}
      </div>
    );
  }

  // Full display
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Achievements</h3>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {badges.map((badge: any) => (
            <Tooltip key={badge.badge_type}>
              <TooltipTrigger asChild>
                <div className={`p-2 rounded-lg border cursor-help flex items-center gap-1 ${badgeColors[badge.badge_type] || badgeColors.verified}`}>
                  {badgeIcons[badge.badge_type] || badgeIcons.verified}
                  <span className="text-xs font-semibold">{badgeLabels[badge.badge_type]}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{badgeLabels[badge.badge_type] || badge.badge_type}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
