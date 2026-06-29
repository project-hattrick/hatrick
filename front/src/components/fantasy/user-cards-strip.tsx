import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { PlayerCard } from './player-card';
import { userCards } from '@/config/fantasy-cards.config';

/** Horizontal strip of the user's collectible cards, above the crowd. */
export function UserCardsStrip() {
  return (
    <GlassPanel tone="surface" className="flex w-full shrink-0 flex-col overflow-hidden">
      <SectionHeader title="My Cards" className="border-b border-border/60 bg-surface-1/60" />
      <div className="custom-scrollbar flex gap-2.5 overflow-x-auto p-3">
        {userCards.map((card) => (
          <PlayerCard key={card.id} card={card} />
        ))}
      </div>
    </GlassPanel>
  );
}
