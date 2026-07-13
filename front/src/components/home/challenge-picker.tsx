'use client';

import { useState, useDeferredValue } from 'react';
import Image from 'next/image';

import { Flag } from '@/components/common/flag';
import { MagnifyingGlass, Sword } from '@/components/common/icons';
import { fifaToIso } from '@/lib/country';
import { duelists, type PlayerProfile } from '@/config/duelists.config';
import { rankTierConfig } from '@/config/matchmaking.config';
import { useSearchDuelists } from '@/services/queries/use-search-duelists';
import { useDuelStore } from '@/store/duel.store';
import { useUiStore } from '@/store/ui.store';

/** How many opponents to suggest before the user types anything. */
const SUGGESTION_COUNT = 3;

interface ChallengePickerProps {
  /** Called after an opponent is picked and the duel setup is initialized. */
  onPick?: () => void;
}

/**
 * Inline opponent picker for the direct-challenge card — a search box with a few
 * suggested players always visible (8-ball-pool style). Picking one starts the
 * duel with the currently selected token stake and reveals the XI setup step.
 */
export function ChallengePicker({ onPick }: ChallengePickerProps) {
  const bet = useUiStore((s) => s.challengeBet);
  const startDuel = useDuelStore((s) => s.start);

  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const { data: results = [] } = useSearchDuelists(deferredQuery);

  const hasQuery = deferredQuery.trim().length > 0;
  const players = (hasQuery ? results : duelists).slice(0, SUGGESTION_COUNT);

  const pick = (player: PlayerProfile) => {
    startDuel(player.username, player, bet);
    onPick?.();
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-surface-deep/40 px-3 py-2">
        <MagnifyingGlass className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players…"
          className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {players.length === 0 ? (
        <p className="text-micro px-2 py-3 text-center text-muted-foreground">No players match &quot;{deferredQuery}&quot;.</p>
      ) : (
        players.map((player) => {
          const tier = rankTierConfig[player.tier];
          return (
            <button
              key={player.id}
              type="button"
              onClick={() => pick(player)}
              className="group flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-surface-3/60"
            >
              <span className="relative grid size-8 shrink-0 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-white/10">
                <Image
                  src={player.portraitSrc}
                  alt={player.name}
                  width={32}
                  height={32}
                  className="translate-y-[6%] scale-110 object-contain object-bottom"
                  style={{ imageRendering: 'pixelated' }}
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-1.5">
                  <Flag code={fifaToIso(player.country)} className="text-xs" />
                  <span className="truncate text-xs font-semibold">{player.name}</span>
                </span>
                <span className="text-micro text-muted-foreground">
                  {tier.label} {player.division} · {player.rating} MMR
                </span>
              </span>
              <Sword className="size-4 shrink-0 text-neon opacity-0 transition group-hover:opacity-100" />
            </button>
          );
        })
      )}
    </div>
  );
}
