'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { MiniHoloCard } from './mini-holo-card';
import { useSelfDeck } from '@/hooks/use-self-deck';

/** Horizontal strip of the signed-in player's actual cards (fielded squad → collection → demo fallback). */
export function UserCardsStrip() {
  const cards = useSelfDeck();

  return (
    <GlassPanel tone="surface" className="flex w-full shrink-0 flex-col overflow-hidden">
      <SectionHeader title="My Cards" className="border-b border-border/60 bg-surface-1/60" />
      <div className="custom-scrollbar flex gap-2.5 overflow-x-auto p-3">
        {cards.map((card) => (
          <MiniHoloCard key={card.id} card={card} />
        ))}
      </div>
    </GlassPanel>
  );
}
