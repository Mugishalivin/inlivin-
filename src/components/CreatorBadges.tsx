import { BADGE_TIERS, BadgeChip, BadgeMark, normalizeBadgeTier, type BadgeTier } from "@/components/UserBadge";

/**
 * The platform supports exactly two badges:
 *  - premium  (gold)  → paying / premium members
 *  - verified (blue)   → identity verified accounts
 */
export const BADGE_TYPES: { value: BadgeTier; label: string; description: string }[] = [
  { value: "premium", label: "Premium (Gold)", description: "Premium member" },
  { value: "verified", label: "Verified (Blue)", description: "Verified account" },
];

export function CreatorBadge({
  type,
  size = "md",
  showLabel = false,
}: {
  type: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const tier = normalizeBadgeTier(type);
  if (!tier) return null;
  if (showLabel) return <BadgeChip tier={tier} />;
  const px = size === "sm" ? 14 : size === "lg" ? 20 : 16;
  return <BadgeMark tier={tier} size={px} />;
}

export function CreatorBadgesRow({ badges, max = 2 }: { badges: string[]; max?: number }) {
  const tiers = Array.from(
    new Set(badges.map((badge) => normalizeBadgeTier(badge)).filter(Boolean) as BadgeTier[]),
  ).slice(0, max);
  if (!tiers.length) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {tiers.map((tier) => (
        <BadgeMark key={tier} tier={tier} size={14} />
      ))}
    </span>
  );
}

export function BadgesList() {
  return (
    <div className="space-y-3">
      {(Object.keys(BADGE_TIERS) as BadgeTier[]).map((tier) => (
        <div key={tier} className="flex items-center gap-2">
          <BadgeChip tier={tier} />
          <span className="ml-auto text-xs text-muted-foreground">{BADGE_TIERS[tier].description}</span>
        </div>
      ))}
    </div>
  );
}
