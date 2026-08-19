import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type BadgeTier = "premium" | "verified";

export const BADGE_TIERS: Record<BadgeTier, { label: string; description: string; icon: typeof BadgeCheck; className: string; chip: string }> = {
  premium: {
    label: "Premium",
    description: "Premium member",
    icon: Crown,
    className: "text-amber-500",
    chip: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  },
  verified: {
    label: "Verified",
    description: "Verified account",
    icon: BadgeCheck,
    className: "text-sky-500",
    chip: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  },
};

/** Anything legacy in the DB resolves down to one of the two supported tiers. */
export function normalizeBadgeTier(value?: string | null): BadgeTier | null {
  if (!value) return null;
  const key = value.toLowerCase();
  if (key === "premium" || key === "gold" || key === "premium_user") return "premium";
  if (key === "verified" || key === "blue" || key === "verified_creator") return "verified";
  return null;
}

export function useUserBadge(userId?: string | null) {
  const { data } = useQuery({
    queryKey: ["user-badge", userId],
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<BadgeTier | null> => {
      const { data, error } = await supabase
        .from("creator_badges")
        .select("badge_type, is_active")
        .eq("user_id", userId as string);
      if (error) return null;
      const tiers = (data ?? [])
        .filter((row: any) => row.is_active !== false)
        .map((row: any) => normalizeBadgeTier(row.badge_type))
        .filter(Boolean) as BadgeTier[];
      if (tiers.includes("premium")) return "premium";
      if (tiers.includes("verified")) return "verified";
      return null;
    },
  });
  return data ?? null;
}

export function BadgeMark({
  tier,
  size = 14,
  className,
}: {
  tier: BadgeTier;
  size?: number;
  className?: string;
}) {
  const config = BADGE_TIERS[tier];
  const Icon = config.icon;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex shrink-0 items-center", config.className, className)} aria-label={config.label}>
            <Icon size={size} strokeWidth={2.4} fill="currentColor" fillOpacity={tier === "verified" ? 0.15 : 0.2} />
          </span>
        </TooltipTrigger>
        <TooltipContent>{config.description}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Small chip with icon + label, for profile headers and admin lists. */
export function BadgeChip({ tier, className }: { tier: BadgeTier; className?: string }) {
  const config = BADGE_TIERS[tier];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        config.chip,
        className,
      )}
    >
      <Icon size={12} strokeWidth={2.6} /> {config.label}
    </span>
  );
}

/** Badge resolved from the database for a given user, rendered inline after their name. */
export function UserBadge({ userId, size = 14, className }: { userId?: string | null; size?: number; className?: string }) {
  const tier = useUserBadge(userId);
  if (!tier) return null;
  return <BadgeMark tier={tier} size={size} className={className} />;
}
