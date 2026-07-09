'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formations } from '@/config/formation.config';
import { useFantasyStore } from '@/store/fantasy.store';

/** Read-only pitch preview of the saved Starting XI (fantasy.store.squad → collection). */
export function StartingXiPreview() {
  const collection = useFantasyStore((s) => s.collection);
  const squad = useFantasyStore((s) => s.squad);
  const formation = formations[0];

  if (!squad.length) {
    return (
      <p className="m-4 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
        No XI yet —{' '}
        <Link href="/fantasy" className="ml-1 text-neon">
          build your squad
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="pitch-stripes-v relative m-4 min-h-44 flex-1 overflow-hidden rounded-2xl border border-white/10">
      <div className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-white/10" />
      {formation.slots.map((slot, i) => {
        const card = collection[squad[i]];
        return (
          <div
            key={i}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
          >
            <span className="grid size-7 place-items-end overflow-hidden rounded-full border border-white/20 bg-gradient-to-b from-surface-3 to-surface-deep">
              {card?.portraitSrc && (
                <Image
                  src={card.portraitSrc}
                  alt={card.name}
                  width={28}
                  height={28}
                  className="translate-y-[8%] scale-125 object-contain object-bottom"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
