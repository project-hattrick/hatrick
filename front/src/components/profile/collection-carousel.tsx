'use client';

import { useRef } from 'react';
import { CaretLeft, CaretRight } from '@/components/common/icons';
import { HoloPlayerCard } from '@/components/store/holo-player-card';
import { cn } from '@/lib/utils';
import { useFantasyStore } from '@/store/fantasy.store';

/** Card width in px — the carousel scroll step derives from it (+ gap). */
const CARD_W = 176;
const STEP = CARD_W + 16;

function Arrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? CaretLeft : CaretRight;
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Previous cards' : 'Next cards'}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface-1/90 text-foreground shadow-e3 backdrop-blur transition hover:border-neon/40 hover:text-neon',
        side === 'left' ? 'left-2' : 'right-2',
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

/** The owned collection (fantasy.store) as big holographic cards in a snapping carousel. */
export function CollectionCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const collection = useFantasyStore((s) => s.collection);
  const scroll = (direction: number) => ref.current?.scrollBy({ left: direction * STEP, behavior: 'smooth' });

  if (!collection.length) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        No players yet — open a pack to start your collection.
      </p>
    );
  }

  return (
    <div className="relative">
      <div ref={ref} className="custom-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3">
        {collection.map((card, i) => (
          <figure
            key={card.ownedCardId ?? `${card.name}-${i}`}
            className="flex shrink-0 snap-start flex-col items-center gap-2"
            style={{ width: CARD_W }}
          >
            <HoloPlayerCard {...card} width={CARD_W} />
            <figcaption className="flex w-full items-center justify-center gap-1.5 text-xs">
              <span className="truncate font-semibold">{card.name}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <Arrow side="left" onClick={() => scroll(-1)} />
      <Arrow side="right" onClick={() => scroll(1)} />
    </div>
  );
}
