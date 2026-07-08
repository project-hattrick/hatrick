'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { HoloPlayerCard } from '@/components/store/holo-player-card';
import { cn } from '@/lib/utils';
import { useFantasyStore } from '@/store/fantasy.store';
import { SectionLink } from './section-link';

/** How many cards to peek at in the board column. */
const PREVIEW = 3;

/** Board column: a peek at the player's real card collection. */
function CollectionCard() {
  const collection = useFantasyStore((s) => s.collection);
  const preview = collection.slice(0, PREVIEW);

  return (
    <GlassPanel tone="surface" className="flex h-full flex-col">
      <SectionHeader title="Your collection" action={<SectionLink href="/fantasy" label="View full collection" />} />
      <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
        {preview.length ? (
          <>
            <div className="custom-scrollbar flex items-center gap-3 overflow-x-auto pb-1">
              {preview.map((card, i) => (
                <div key={card.ownedCardId ?? `${card.name}-${i}`} className="w-[120px] shrink-0">
                  <HoloPlayerCard {...card} width={120} />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              {collection.slice(0, 8).map((card, index) => (
                <span
                  key={card.ownedCardId ?? `${card.name}-${index}`}
                  className={cn('h-1.5 rounded-full transition-all', index === 0 ? 'w-4 bg-neon' : 'w-1.5 bg-surface-3')}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="flex flex-1 items-center justify-center py-6 text-center text-sm text-muted-foreground">
            No players yet — open a pack to start your collection.
          </p>
        )}
      </div>
    </GlassPanel>
  );
}

export { CollectionCard };
