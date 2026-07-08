import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { MiniHoloCard, type DeckCard } from '@/components/fantasy/mini-holo-card';
import { cn } from '@/lib/utils';

interface DuelDeckRailProps {
  title: string;
  cards: DeckCard[];
  className?: string;
}

/** A player's collectible deck stacked vertically down one side of the arena. */
export function DuelDeckRail({ title, cards, className }: DuelDeckRailProps) {
  return (
    <GlassPanel tone="surface" className={cn('flex min-h-0 flex-col overflow-hidden', className)}>
      <SectionHeader title={title} className="border-b border-border/60 bg-surface-1/60" />
      <div className="custom-scrollbar flex flex-col items-center gap-2.5 overflow-y-auto p-3">
        {cards.map((card) => (
          <MiniHoloCard key={card.id} card={card} />
        ))}
      </div>
    </GlassPanel>
  );
}
