'use client';

import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Lightning, TrendUp } from '@/components/common/icons';
import { talero } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import type { PackCard } from '@/config/pack-pool.config';

/** Split the XI into pitch lines (attack → midfield → defense → keeper), strongest up front. */
const LINES: number[] = [3, 3, 4, 1];

function MiniCard({ card, highlight }: { card: PackCard; highlight?: boolean }) {
  return (
    <div
      className={cn(
        'relative aspect-[5/7] w-[62px] shrink-0 overflow-hidden rounded-lg border shadow-md',
        highlight ? 'border-medal-gold ring-1 ring-medal-gold/60' : 'border-white/10',
      )}
      style={{ backgroundColor: '#101013', backgroundImage: "url('/cards/card-texture.png')", backgroundSize: 'cover' }}
    >
      {card.portraitSrc && (
        <Image src={card.portraitSrc} alt={card.name} fill sizes="62px" className="object-contain object-bottom opacity-95" />
      )}
      <div className="absolute top-1 left-1.5 flex flex-col leading-none">
        <span className={cn(talero.className, 'text-sm text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.7)]')}>
          {card.number}
        </span>
        <span className="text-[9px]">{card.flag}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1 pt-3 pb-1 text-center">
        <p className="truncate text-[8px] font-bold tracking-wide text-white uppercase">{card.name}</p>
      </div>
    </div>
  );
}

/**
 * Squad step — auto-lines up the strongest pulls into a starting XI on a pitch, then locks it.
 * Purely a preview + confirm (no drag), so the new player gets an instant "I have a team" moment.
 */
export function SquadStep({ collection, onLock }: { collection: PackCard[]; onLock: (squad: number[]) => void }) {
  // Strongest pulls first, capped at an XI. Keep original indices so `squad` points back into the collection.
  const ranked = collection
    .map((card, index) => ({ card, index }))
    .sort((a, b) => (b.card.number ?? 0) - (a.card.number ?? 0))
    .slice(0, 11);

  const strength = ranked.length
    ? Math.round(ranked.reduce((sum, { card }) => sum + (card.number ?? 0), 0) / ranked.length)
    : 0;

  // Slice the ranked XI into pitch lines.
  const lines: { card: PackCard; index: number }[][] = [];
  let cursor = 0;
  for (const size of LINES) {
    const row = ranked.slice(cursor, cursor + size);
    if (row.length) lines.push(row);
    cursor += size;
  }

  const lockSquad = () => onLock(ranked.map(({ index }) => index));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Your starting XI</p>
        <span className="flex items-center gap-1.5 text-micro font-bold text-neon">
          <TrendUp className="size-3.5" weight="bold" />
          {strength} OVR
        </span>
      </div>

      <div className="pitch-stripes-v flex flex-col justify-between gap-3 rounded-2xl border border-white/10 p-4">
        {lines.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {row.map(({ card, index }) => (
              <MiniCard key={card.name} card={card} highlight={index === ranked[0]?.index} />
            ))}
          </div>
        ))}
      </div>

      <Button size="lg" shape="pill" className="w-full gap-2" onClick={lockSquad} disabled={!ranked.length}>
        <Lightning className="size-4" weight="fill" />
        Lock my squad
      </Button>
    </div>
  );
}
