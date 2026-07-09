'use client';

import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { PlayerProfile } from '@/config/duelists.config';
import { rankTierConfig } from '@/config/matchmaking.config';
import { DuelPhase } from '@/enums/duel-phase.enum';
import { useSelfProfile } from '@/hooks/use-self-identity';
import { useDuelStore } from '@/store/duel.store';

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

/** Clock chip copy per duel phase (minute while a half runs). */
const clockLabel = (phase: DuelPhase, simMinute: number): string =>
  phase === DuelPhase.HalfTime ? 'HT' : phase === DuelPhase.FullTime ? 'FT' : `${simMinute}'`;

/**
 * Personalized 1v1 scoreline — profile avatars flank the live score (self left, opponent right).
 * Score + simulated 90' clock come from the duel store (the chance-battle director is authoritative).
 */
export function DuelScoreboard() {
  const self = useSelfProfile();
  const opponent = useDuelStore((s) => s.opponent);
  const selfScore = useDuelStore((s) => s.selfScore);
  const opponentScore = useDuelStore((s) => s.opponentScore);
  const simMinute = useDuelStore((s) => s.simMinute);
  const phase = useDuelStore((s) => s.phase);

  if (!opponent) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-3 sm:gap-5">
        <DuelistColumn player={self} />
        <div className="flex items-center gap-2 text-[34px] font-bold leading-none [text-shadow:0_4px_24px_rgba(0,0,0,0.85)] sm:gap-2.5 sm:text-[48px]">
          <span>{selfScore}</span>
          <span className="text-2xl text-muted-foreground sm:text-[30px]">–</span>
          <span>{opponentScore}</span>
        </div>
        <DuelistColumn player={opponent} reversed />
      </div>
      <span className="rounded-full bg-black/55 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-white/85 backdrop-blur-sm">
        {clockLabel(phase, simMinute)}
      </span>
    </div>
  );
}
