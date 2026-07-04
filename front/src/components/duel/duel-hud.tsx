'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { cn } from '@/lib/utils';
import { selfProfile } from '@/config/duelists.config';
import type { PlayerProfile } from '@/config/duelists.config';
import { rankTierConfig } from '@/config/matchmaking.config';
import { fifaToIso } from '@/lib/country';
import { useDuelStore } from '@/store/duel.store';

interface PlayerChipProps {
  player: PlayerProfile;
  /** Mirrors left-hand items when true (flag → name → tier order reversed). */
  reversed?: boolean;
  /** Optional eyebrow label shown before all content. */
  label?: string;
}

function PlayerChip({ player, reversed, label }: PlayerChipProps) {
  const tier = rankTierConfig[player.tier];

  return (
    <GlassPanel
      radius="pill"
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium',
        reversed && 'flex-row-reverse',
      )}
    >
      {label && (
        <span className="text-eyebrow mr-0.5 shrink-0 text-neon">{label}</span>
      )}
      <Flag code={fifaToIso(player.country)} className="text-sm" />
      <span className="max-w-[7rem] truncate font-bold">{player.name}</span>
      <span
        className="text-eyebrow shrink-0 rounded-full px-2 py-0.5"
        style={{
          backgroundImage: `linear-gradient(to bottom, ${tier.from}, ${tier.to})`,
          color: tier.text,
        }}
      >
        {tier.label}
      </span>
    </GlassPanel>
  );
}

/**
 * Duel identity banner — left chip (You) + right chip (Opponent) flanking
 * the engine's own score pill. pointer-events-none so engine interactions pass through.
 */
export function DuelHud() {
  const opponent = useDuelStore((s) => s.opponent);

  if (!opponent) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3.5 z-20 flex items-start justify-between gap-2">
      <PlayerChip player={selfProfile} label="You" />
      <PlayerChip player={opponent} reversed />
    </div>
  );
}
