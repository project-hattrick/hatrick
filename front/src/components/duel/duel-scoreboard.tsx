'use client';

import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { PlayerProfile } from '@/config/duelists.config';
import { rankTierConfig } from '@/config/matchmaking.config';
import { useSelfProfile } from '@/hooks/use-self-identity';
import { useDuelStore } from '@/store/duel.store';
import { useRealGkStore } from '@/store/real-gk.store';

/** One player identity column: avatar + name + tier badge. Mirrored when reversed. */
function DuelistColumn({ player, reversed }: { player: PlayerProfile; reversed?: boolean }) {
  const tier = rankTierConfig[player.tier];

  return (
    <div className={cn('flex items-center gap-2 sm:gap-2.5', reversed && 'flex-row-reverse')}>
      <Avatar
        name={player.name}
        src={player.portraitSrc}
        className="size-10 shrink-0 ring-2 ring-border sm:size-14"
      />
      <div className={cn('flex flex-col gap-0.5', reversed ? 'items-end' : 'items-start')}>
        <span className="max-w-[7rem] truncate text-xs font-bold text-foreground/95 [text-shadow:0_2px_10px_rgba(0,0,0,0.8)] sm:text-sm">
          {player.name}
        </span>
        <span
          className="text-eyebrow rounded-full px-2 py-0.5"
          style={{ backgroundImage: `linear-gradient(to bottom, ${tier.from}, ${tier.to})`, color: tier.text }}
        >
          {tier.label}
        </span>
      </div>
    </div>
  );
}

/**
 * Personalized 1v1 scoreline — profile avatars flank the live score (self left, opponent right).
 * Score is mirrored from the engine (self = Blue, opponent = Red), same source page.tsx reads.
 */
export function DuelScoreboard() {
  const self = useSelfProfile();
  const opponent = useDuelStore((s) => s.opponent);
  const scoreBlue = useRealGkStore((s) => s.scoreBlue);
  const scoreRed = useRealGkStore((s) => s.scoreRed);

  if (!opponent) return null;

  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <DuelistColumn player={self} />
      <div className="flex items-center gap-2 text-[34px] font-bold leading-none [text-shadow:0_4px_24px_rgba(0,0,0,0.85)] sm:gap-2.5 sm:text-[48px]">
        <span>{scoreBlue}</span>
        <span className="text-2xl text-muted-foreground sm:text-[30px]">–</span>
        <span>{scoreRed}</span>
      </div>
      <DuelistColumn player={opponent} reversed />
    </div>
  );
}
