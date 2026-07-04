import { rankTierConfig } from '@/config/matchmaking.config';
import { RankTier } from '@/enums/rank-tier.enum';

interface TierBadgeProps {
  tier: RankTier;
  division?: string;
}

/** Small rank-tier badge using the same gradient/text palette as DuelistCard. */
export function TierBadge({ tier, division }: TierBadgeProps) {
  const meta = rankTierConfig[tier];

  return (
    <span
      className="text-eyebrow rounded-full px-2.5 py-1"
      style={{
        backgroundImage: `linear-gradient(to bottom, ${meta.from}, ${meta.to})`,
        color: meta.text,
      }}
    >
      {meta.label}
      {division ? ` ${division}` : ''}
    </span>
  );
}
