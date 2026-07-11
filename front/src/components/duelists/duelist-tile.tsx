import Image from 'next/image';
import Link from 'next/link';
import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { fifaToIso } from '@/lib/country';
import { rankTierConfig } from '@/config/matchmaking.config';
import { RankTier } from '@/enums/rank-tier.enum';
import { TierBadge } from './tier-badge';
import { PresenceDot } from './presence-dot';
import { FriendButton } from './friend-button';
import { ChallengeButton } from './challenge-button';
import type { PlayerProfile } from '@/config/duelists.config';

interface DuelistTileProps {
  profile: PlayerProfile;
}

/** Directory card for one player — portrait, identity, rank, stats, presence and action buttons. */
export function DuelistTile({ profile }: DuelistTileProps) {
  const tierMeta = rankTierConfig[profile.tier];
  const isEliteTier = profile.tier === RankTier.Master || profile.tier === RankTier.Diamond;

  return (
    <GlassPanel
      tone="surface"
      radius="xl"
      className="group relative flex flex-col items-center gap-3 overflow-hidden p-4 text-center transition-transform duration-300 ease-out hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {/* Tier-tinted top edge — same metal gradient the tier badge uses. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ backgroundImage: `linear-gradient(to right, ${tierMeta.from}, ${tierMeta.to})` }}
      />
      {/* Elite wash for the top tiers only. */}
      {isEliteTier ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 50% 0%, color-mix(in oklch, ${tierMeta.from} 10%, transparent), transparent 55%)`,
          }}
        />
      ) : null}

      {/* Portrait */}
      <span className="relative grid size-16 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-border transition-colors group-hover:ring-neon/40">
        <Image
          src={profile.portraitSrc}
          alt={profile.name}
          width={64}
          height={64}
          className="translate-y-[6%] scale-110 object-contain object-bottom"
          style={{ imageRendering: 'pixelated' }}
        />
      </span>

      {/* Name + flag */}
      <div className="flex items-center gap-1.5">
        <Flag code={fifaToIso(profile.country)} className="text-sm" />
        <Link
          href={`/duelists/${profile.username}`}
          className="max-w-[9rem] truncate text-sm font-bold transition-colors hover:text-neon"
        >
          {profile.name}
        </Link>
      </div>

      {/* Tier badge */}
      <TierBadge tier={profile.tier} division={profile.division} />

      {/* MMR */}
      <div className="flex flex-col items-center">
        <span className="font-mono text-lg font-bold tabular-nums text-foreground">
          {profile.rating}
        </span>
        <span className="text-micro text-muted-foreground">MMR</span>
      </div>

      {/* W / L / Streak */}
      <div className="text-micro flex items-center gap-1.5 text-muted-foreground">
        <span className="font-semibold text-neon">{profile.wins}W</span>
        <span className="font-semibold text-live">{profile.losses}L</span>
        <span>·</span>
        <span>{profile.streak}</span>
      </div>

      {/* Presence */}
      <PresenceDot presence={profile.presence} showLabel />

      {/* Actions */}
      <div className="flex w-full items-center justify-center gap-2">
        <FriendButton id={profile.id} />
        <ChallengeButton profile={profile} />
      </div>
    </GlassPanel>
  );
}
