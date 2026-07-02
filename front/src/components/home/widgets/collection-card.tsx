import Link from 'next/link';
import { Sparkle } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { HoloPlayerCard, type CardStat } from '@/components/store/holo-player-card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SectionLink } from './section-link';
import { statOrder, userCards, type PlayerCardData } from '@/config/fantasy-cards.config';

const previewCards = userCards.slice(0, 3);

const toCardStats = (card: PlayerCardData): CardStat[] =>
  statOrder.map(([label, key]) => ({ value: card.stats[key], label }));

/** Board column: a peek at the player's card collection + a pack teaser. */
function CollectionCard() {
  return (
    <GlassPanel tone="surface" className="flex h-full flex-col">
      <SectionHeader title="Your collection" action={<SectionLink href="/fantasy" label="View full collection" />} />
      <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <div className="custom-scrollbar flex items-center gap-3 overflow-x-auto pb-1">
          {previewCards.map((card) => (
            <div key={card.id} className="w-[120px] shrink-0">
              <HoloPlayerCard
                number={card.rating}
                flag={card.flag}
                holoColors={card.holoColors}
                stats={toCardStats(card)}
                portraitSrc={card.portraitSrc}
                width={120}
              />
            </div>
          ))}
          <div className="flex h-[168px] w-[88px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-neon/40 bg-neon/5 p-2 text-center">
            <Sparkle className="size-6 text-neon" />
            <span className="text-[9px] font-bold tracking-wide text-neon uppercase">Epic Pack</span>
            <Link href="/fantasy" className={buttonVariants({ variant: 'default', size: 'xs', className: 'h-6 px-2 text-[10px]' })}>
              Open pack
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: 8 }).map((_, index) => (
            <span
              key={index}
              className={cn('h-1.5 rounded-full transition-all', index === 0 ? 'w-4 bg-neon' : 'w-1.5 bg-surface-3')}
            />
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}

export { CollectionCard };
