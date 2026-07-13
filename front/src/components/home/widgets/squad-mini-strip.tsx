'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Flag } from '@/components/common/flag';
import { UserPlus } from '@/components/common/icons';
import { squad } from '@/config/squad.config';
import { useFantasyStore } from '@/store/fantasy.store';
import { numberForId, variantFor } from '@/lib/player-identity';
import { AppMode } from '@/enums/app-mode.enum';

/** Fixed collection size — the roster fills these slots, any leftover renders as an empty state. */
const SQUAD_SLOTS = 12;

/** Normalized strip entry — real card state, licensing-safe identity. */
interface MiniSlot {
  id: string;
  number: number;
  name: string;
  position: string;
  code: string;
  portraitSrc: string;
}

/**
 * The user's real fielded squad (falls back to their collection, then a generic demo roster). Names
 * are resolved through the 11 player variants so a stored real name is never rendered.
 */
function useMiniSquad(): MiniSlot[] {
  const squadIdx = useFantasyStore((s) => s.squad);
  const collection = useFantasyStore((s) => s.collection);

  const owned = squadIdx.map((i) => collection[i]).filter(Boolean);
  const source = owned.length ? owned : collection.slice(0, 11);
  if (source.length) {
    return source.map((card, i) => {
      const id = card.ownedCardId ?? `${card.name}-${i}`;
      const variant = variantFor(id);
      return {
        id,
        number: numberForId(id),
        name: variant.name,
        position: card.position ?? variant.position,
        code: card.code ?? variant.code,
        portraitSrc: card.portraitSrc ?? variant.portraitSrc,
      };
    });
  }
  // Guest / empty collection — the curated generic squad (already licensing-safe).
  return squad.map((p) => ({
    id: p.id,
    number: p.number,
    name: p.name,
    position: p.position,
    code: p.code,
    portraitSrc: p.portraitSrc,
  }));
}

/** Roster laid over the full row width as a fixed set of slots (filled cards + empty placeholders). */
export function SquadMiniStrip() {
  const players = useMiniSquad();
  const slots = Array.from({ length: SQUAD_SLOTS }, (_, index) => players[index] ?? null);

  return (
    // Mobile: edge-to-edge swipe carousel (bleeds past the page padding); md+: the original even grid.
    <div className="custom-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:w-full md:auto-cols-fr md:grid-flow-col md:overflow-visible md:px-0 md:pb-0">
      {slots.map((player, index) =>
        player ? (
          <div
            key={player.id}
            className="flex w-[104px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-surface-2 md:w-auto"
          >
            <div className="relative aspect-[100/76] bg-gradient-to-b from-surface-3 to-surface-1">
              <span className="absolute top-1 left-2 z-10 font-talero text-lg text-neon">{player.number}</span>
              <Image
                src={player.portraitSrc}
                alt={player.name}
                fill
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                className="object-contain object-bottom pt-1"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex flex-col gap-0.5 p-2">
              <span className="truncate text-xs leading-tight font-bold text-white">{player.name}</span>
              <span className="flex items-center gap-1 text-micro font-semibold text-muted-foreground">
                <Flag code={player.code} className="text-micro" />
                <span className="truncate">{player.position}</span>
              </span>
            </div>
          </div>
        ) : (
          <Link
            key={`empty-${index}`}
            href={`/${AppMode.Fantasy}`}
            className="group flex w-[104px] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface-1/40 p-2 text-muted-foreground transition-colors hover:border-neon/40 hover:text-neon md:w-auto"
          >
            <UserPlus className="text-2xl opacity-70 transition-opacity group-hover:opacity-100" />
            <span className="text-micro font-semibold">Empty slot</span>
          </Link>
        ),
      )}
    </div>
  );
}
