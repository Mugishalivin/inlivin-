import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreatorBadge, CreatorBadgesRow } from "@/components/CreatorBadges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        // Try fetching with all columns first
        const { data: badgeData, error } = await supabase
          .from("creator_badges")
          .select("badge_type, reason, awarded_at, is_active")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("awarded_at", { ascending: false });

        // If columns don't exist, fall back to basic query
        if (error && (error.code === '42703' || error.code === 'PGRST204')) {
          const { data: basicBadges } = await supabase
            .from("creator_badges")
            .select("badge_type")
            .eq("user_id", userId);
          return basicBadges?.map(b => ({ badge_type: b.badge_type, reason: null, awarded_at: null, is_active: true })) || [];
        }

        return badgeData || [];
      } catch (err) {
        console.error("Error fetching creator badges:", err);
        return [];
      }
    },
    enabled: !!userId,
  });

  if (badges.length === 0) return null;

  const badgeTypes = badges.map(b => b.badge_type);
  const displayBadges = badgeTypes.slice(0, max);
  const remaining = Math.max(0, badgeTypes.length - max);

  if (displayType === 'row') {
    return (
      <div className="flex flex-wrap gap-1">
        {displayBadges.map((badge) => (
          <TooltipProvider key={badge}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <CreatorBadge type={badge as any} size="sm" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{badge.replace(/_/g, ' ').toUpperCase()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {remaining > 0 && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-secondary text-muted-foreground">
            +{remaining}
          </span>
        )}
      </div>
    );
  }

  if (displayType === 'compact') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {displayBadges.map((badge) => (
          <CreatorBadge key={badge} type={badge as any} size="sm" />
        ))}
        {remaining > 0 && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
            +{remaining} more
          </span>
        )}
      </div>
    );
  }

  // Full display with details
  return (
    <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-primary/10">
      <h3 className="text-sm font-semibold">Creator Achievements</h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge: any) => (
          <TooltipProvider key={badge.badge_type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <CreatorBadge type={badge.badge_type as any} size="md" showLabel={true} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="text-xs space-y-1">
                  <p className="font-semibold">{badge.badge_type.replace(/_/g, ' ')}</p>
                  {badge.reason && <p className="text-muted-foreground italic">"{badge.reason}"</p>}
                  {badge.awarded_at && <p className="text-muted-foreground text-[10px]">Awarded {new Date(badge.awarded_at).toLocaleDateString()}</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}
