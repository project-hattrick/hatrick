import Image from 'next/image';
import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { fifaToIso } from '@/lib/country';
import { TierBadge } from './tier-badge';
import { PresenceDot } from './presence-dot';
import { FriendButton } from './friend-button';
import { ChallengeButton } from './challenge-button';
import { PvpChallengeButton } from './pvp-challenge-button';
import type { PlayerProfile } from '@/config/duelists.config';

interface DuelistHeaderProps {
  profile: PlayerProfile;
}

/** Public profile hero: portrait, identity, rank, stats, bio, joined year and action buttons. */
export function DuelistHeader({ profile }: DuelistHeaderProps) {
  const joinedYear = new Date(profile.joinedAt).getFullYear();

  return (
    <GlassPanel
      tone="surface"
      radius="xl"
      className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6"
    >
      {/* Portrait */}
      <span className="relative mx-auto grid size-24 shrink-0 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-2 ring-border sm:mx-0">
        <Image
          src={profile.portraitSrc}
          alt={profile.name}
          width={96}
          height={96}
          className="translate-y-[6%] scale-110 object-contain object-bottom"
          style={{ imageRendering: 'pixelated' }}
        />
      </span>

      {/* Identity column */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Name + handle */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Flag code={fifaToIso(profile.country)} className="text-base" />
            <h1 className="text-title">{profile.name}</h1>
            <span className="text-sm text-muted-foreground">@{profile.username}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TierBadge tier={profile.tier} division={profile.division} />
            <PresenceDot presence={profile.presence} showLabel />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex flex-col items-center">
            <span className="font-mono font-bold tabular-nums">{profile.rating}</span>
            <span className="text-micro text-muted-foreground">MMR</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-neon">{profile.wins}</span>
            <span className="text-micro text-muted-foreground">Wins</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-live">{profile.losses}</span>
            <span className="text-micro text-muted-foreground">Losses</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold">{profile.streak}</span>
            <span className="text-micro text-muted-foreground">Streak</span>
          </div>
        </div>

        {/* Bio */}
        {profile.bio ? (
          <p className="text-sm text-muted-foreground">{profile.bio}</p>
        ) : null}

        {/* Footer: joined + action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-micro text-muted-foreground">Joined {joinedYear}</span>
          <div className="flex items-center gap-2">
            <FriendButton id={profile.id} />
            <ChallengeButton profile={profile} />
            <PvpChallengeButton profile={profile} />
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
