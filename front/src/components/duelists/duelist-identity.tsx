import Image from 'next/image';
import { Flag } from '@/components/common/flag';
import { CalendarDots, Crown } from '@/components/common/icons';
import { fifaToIso } from '@/lib/country';
import { cn } from '@/lib/utils';
import { TierBadge } from './tier-badge';
import { PresenceDot } from './presence-dot';
import { HeadToHeadCard } from './head-to-head-card';
import { formatJoined, rankFromRating } from '@/config/profile-mock';
import type { PlayerProfile } from '@/config/duelists.config';

function MiniStat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className={cn('font-mono text-lg font-bold tabular-nums', accent ? 'text-neon' : 'text-foreground')}>
        {value}
      </span>
      <span className="text-micro text-muted-foreground">{label}</span>
    </div>
  );
}

/** Left identity column: avatar (overlapping the cover), name, tier, mini stats, H2H and meta. */
export function DuelistIdentity({ profile }: { profile: PlayerProfile }) {
  const rank = rankFromRating(profile.rating);

  return (
    <div className="flex flex-col">
      <span className="relative z-10 -mt-14 grid size-24 shrink-0 place-items-end overflow-hidden rounded-2xl bg-gradient-to-b from-surface-3 to-surface-deep shadow-xl ring-2 ring-neon/30">
        <Image
          src={profile.portraitSrc}
          alt={profile.name}
          width={96}
          height={96}
          className="translate-y-[6%] scale-110 object-contain object-bottom"
          style={{ imageRendering: 'pixelated' }}
        />
      </span>

      <div className="mt-3 flex items-center gap-2">
        <h1 className="text-xl font-bold">{profile.name}</h1>
        <span className="grid size-5 place-items-center rounded-full bg-neon text-primary-foreground">
          <Crown className="size-3" weight="fill" />
        </span>
      </div>
      <span className="text-micro mt-0.5 font-mono text-muted-foreground">@{profile.username}</span>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TierBadge tier={profile.tier} division={profile.division} />
        <PresenceDot presence={profile.presence} showLabel />
      </div>

      <div className="mt-4 flex gap-6">
        <MiniStat value={String(profile.wins)} label="Wins" />
        <MiniStat value={String(profile.losses)} label="Losses" />
        <MiniStat value={`#${rank}`} label="Rank" accent />
      </div>

      <HeadToHeadCard profile={profile} />

      <div className="mt-4 flex flex-col gap-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <Flag code={fifaToIso(profile.country)} className="text-sm" />
          <span>
            Represents <b className="font-semibold text-foreground">{profile.country}</b>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <CalendarDots className="size-4" />
          <span>
            Joined <b className="font-semibold text-foreground">{formatJoined(profile.joinedAt)}</b>
          </span>
        </span>
      </div>

      {profile.bio ? <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{profile.bio}</p> : null}
    </div>
  );
}
