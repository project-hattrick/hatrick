import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { HoloPlayerCard } from '@/components/store/holo-player-card';
import { rarityFor, RARITY_THEME } from '@/config/card-rarity.config';
import { statOrder, type PlayerCardData } from '@/config/fantasy-cards.config';
import { cn } from '@/lib/utils';

/** Mock market price scaled from the card rating (≈1.9–2.5 SOL for the star pool). */
const cardPrice = (rating: number): string => `${((rating - 78) / 7.5).toFixed(1)} SOL`;

/** Degrees of resting tilt per slot away from the row centre (sticker-hand spread). */
const TILT_STEP_DEG = 3;

/**
 * A market-picks product tile: the pack-opening holo card fused with its
 * name/price/rarity footer on the v6 rarity surface (corner wash + diagonal
 * streaks). Cards rest fanned like a sticker hand — tilting outward toward the
 * corners — and straighten upright + rise on hover.
 */
export function MarketPickCard({ card, index, total }: { card: PlayerCardData; index: number; total: number }) {
  const rarity = rarityFor(card.rating);
  const theme = RARITY_THEME[rarity];
  const tilt = (index - (total - 1) / 2) * TILT_STEP_DEG;

  return (
    <Link
      href="/fantasy/market"
      style={{ '--tilt': `${tilt}deg` } as CSSProperties}
      className={cn(
        'relative flex rotate-[var(--tilt)] flex-col overflow-hidden rounded-xl border bg-surface-deep transition-transform duration-300 ease-out',
        'hover:z-10 hover:-translate-y-2 hover:rotate-0 hover:shadow-e4',
        'motion-reduce:rotate-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        theme.tileClass || 'border-border/70',
      )}
    >
      {/* v6 rarity surface: corner wash + diagonal streaks fading from the top-right. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(120% 90% at 100% 0%, ${theme.tint}, transparent 55%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `repeating-linear-gradient(118deg, ${theme.tint} 0 1.5px, transparent 1.5px 17px)`,
          maskImage: 'radial-gradient(115% 95% at 100% 0%, #000 26%, transparent 60%)',
          WebkitMaskImage: 'radial-gradient(115% 95% at 100% 0%, #000 26%, transparent 60%)',
        }}
      />

      <div className="relative flex justify-center p-3 pb-0">
        <HoloPlayerCard
          number={card.rating}
          flag={card.flag}
          portraitSrc={card.portraitSrc}
          holoColors={card.holoColors}
          surfaceColors={theme.surfaceColors}
          surfaceShine={theme.surfaceShine}
          stats={statOrder.map(([label, key]) => ({ label, value: card.stats[key] }))}
          width={172}
        />
      </div>
      {/* Fused footer — same panel, attached under the artwork. */}
      <div className="relative mt-3 flex flex-col gap-1.5 border-t border-border/60 bg-surface-deep/70 px-3 py-2.5">
        <span className="truncate text-body font-bold uppercase">
          {card.name} <span className="ml-0.5 font-medium text-muted-foreground">{card.position}</span>
        </span>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-caption font-bold whitespace-nowrap">
            <Image src="/coin.png" alt="" width={14} height={14} className="size-3.5" />
            {cardPrice(card.rating)}
          </span>
          <span className={cn('text-micro font-semibold tracking-wider whitespace-nowrap uppercase', theme.badgeClass)}>
            {theme.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
