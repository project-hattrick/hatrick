'use client';

import Image from 'next/image';

import { TrendUp } from '@/components/common/icons';
import { talero } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import type { PackCard } from '@/config/pack-pool.config';

/** Split the XI into pitch lines (attack → midfield → defense → keeper), strongest up front. */
const LINES: number[] = [3, 3, 4, 1];

/** Strongest pulls first, capped at an XI, keeping original collection indices for `squad`. */
export function pickStartingXI(collection: PackCard[]): { card: PackCard; index: number }[] {
  return collection
    .map((card, index) => ({ card, index }))
    .sort((a, b) => (b.card.number ?? 0) - (a.card.number ?? 0))
    .slice(0, 11);
}

function MiniCard({ card, highlight }: { card: PackCard; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'relative aspect-[5/7] w-[52px] shrink-0 overflow-hidden rounded-lg border shadow-md',
        highlight ? 'border-medal-gold ring-1 ring-medal-gold/60' : 'border-white/10',
      )}
      style={{ backgroundColor: '#101013', backgroundImage: "url('/cards/card-texture.png')", backgroundSize: 'cover' }}
    >
      {card.portraitSrc && (
        <Image src={card.portraitSrc} alt={card.name} fill sizes="52px" className="object-contain object-bottom opacity-95" />
      )}
      <div className="absolute top-1 left-1.5 flex flex-col leading-none">
        <span className={cn(talero.className, 'text-xs text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.7)]')}>
          {card.number}
        </span>
        <span className="text-[8px]">{card.flag}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1 pt-3 pb-1 text-center">
        <p className="truncate text-[7px] font-bold tracking-wide text-white uppercase">{card.name}</p>
      </div>
    </div>
  );
}

/**
 * Formation step — the auto-lined XI on a pitch, with the team rating.
 * Presentational only; the flow footer owns the "Lock formation" action.
 */
export function SquadStep({ collection }: { collection: PackCard[] }) {
  const ranked = pickStartingXI(collection);
  const best = ranked[0]?.card;
  const strength = ranked.length
    ? Math.round(ranked.reduce((sum, { card }) => sum + (card.number ?? 0), 0) / ranked.length)
    : 0;

  const lines: { card: PackCard; index: number }[][] = [];
  let cursor = 0;
  for (const size of LINES) {
    const row = ranked.slice(cursor, cursor + size);
    if (row.length) lines.push(row);
    cursor += size;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="pitch-stripes-v relative flex min-h-[300px] w-full max-w-sm flex-col justify-between gap-3 rounded-2xl border border-white/10 p-4">
        <span className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-micro font-bold text-neon backdrop-blur-sm">
          <TrendUp className="size-3.5" weight="bold" />
          {strength} OVR
        </span>
        {lines.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {row.map(({ card, index }) => (
              <MiniCard key={card.name} card={card} highlight={index === ranked[0]?.index} />
            ))}
          </div>
        ))}
      </div>

      <p className="text-caption text-center text-muted-foreground">
        We picked your strongest eleven{best ? ` — led by ${best.name}` : ''}. Rebuild it any time from your squad.
      </p>
    </div>
  );
}
