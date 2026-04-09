import { Badge } from "@/components/ui/badge";
import { Verified, Flame, TrendingUp, Star, Award, Zap } from "lucide-react";

interface CreatorBadgeProps {
  type: "verified" | "top_collaborator" | "trending_creator" | "consistent_contributor" | "community_helper" | "master_craftsman" | "rising_star";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const badgeConfig = {
  verified: {
    icon: Verified,
    color: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    label: "Verified Creator",
    description: "Verified identity"
  },
  top_collaborator: {
    icon: Star,
    color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    label: "Top Collaborator",
    description: "Great partner"
  },
  trending_creator: {
    icon: TrendingUp,
    color: "bg-green-500/20 text-green-500 border-green-500/30",
    label: "Trending",
    description: "On the rise"
  },
  consistent_contributor: {
    icon: Zap,
    color: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    label: "Consistent",
    description: "Active creator"
  },
  community_helper: {
    icon: Award,
    color: "bg-pink-500/20 text-pink-500 border-pink-500/30",
    label: "Community Helper",
    description: "Helps others"
  },
  master_craftsman: {
    icon: Flame,
    color: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    label: "Master Craftsman",
    description: "Expert creator"
  },
  rising_star: {
    icon: Star,
    color: "bg-indigo-500/20 text-indigo-500 border-indigo-500/30",
    label: "Rising Star",
    description: "New talent"
  }
};

export function CreatorBadge({ type, size = "md", showLabel = false }: CreatorBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;
  
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  }[size];

  return (
    <div className="flex items-center gap-1" title={config.description}>
      <Badge className={`border ${config.color} gap-1`}>
        <Icon className={sizeClass} />
        {showLabel && <span>{config.label}</span>}
      </Badge>
    </div>
  );
}

export function CreatorBadgesRow({ badges, max = 3 }: { badges: string[]; max?: number }) {
  if (!badges.length) return null;
  
  const displayBadges = badges.slice(0, max);
  const remaining = Math.max(0, badges.length - max);

  return (
    <div className="flex flex-wrap gap-1">
      {displayBadges.map((badge) => (
        <CreatorBadge key={badge} type={badge as any} size="sm" />
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-[10px]">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

export function BadgesList() {
  return (
    <div className="space-y-3">
      {Object.entries(badgeConfig).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <CreatorBadge type={key as any} />
          <span className="text-sm">{value.label}</span>
          <span className="text-xs text-muted-foreground ml-auto">{value.description}</span>
        </div>
      ))}
    </div>
  );
}
