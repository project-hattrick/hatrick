'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HoloPlayerCard } from '@/components/store/holo-player-card';
import { PickBuyDialog } from '@/components/store/pick-buy-dialog';
import { useItemPrice, useItemStock } from '@/services/queries/use-store-item';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { rarityFor, RARITY_THEME } from '@/config/card-rarity.config';
import { pickSlug } from '@/config/store-catalog.config';
import { statOrder, type PlayerCardData } from '@/config/fantasy-cards.config';
import { cn } from '@/lib/utils';

const formatStorePrice = (coins: number): string =>
  `${(coins / 100_000).toFixed(2).replace(/0$/, '')} SOL`;

/**
 * A market-picks product tile: the pack-opening holo card fused with its
 * name/price/rarity footer on the v6 rarity surface (corner wash + diagonal
 * streaks). Rises on hover and opens a purchase modal.
 */
export function MarketPickCard({ card }: { card: PlayerCardData }) {
  const [buying, setBuying] = useState(false);
  const rarity = rarityFor(card.rating);
  const theme = RARITY_THEME[rarity];
  const slug = pickSlug(card.id);
  const priceCoins = useItemPrice(slug) ?? 0;
  const price = priceCoins > 0 ? formatStorePrice(priceCoins) : '...';
  const stock = useItemStock(slug);
  const soldOut = stock !== undefined && stock <= 0;
  // Signed out → open the login dialog (same as the navbar) instead of the buy modal.
  const gate = useAuthGate();

  return (
    <>
      <button
        type="button"
        disabled={soldOut}
        onClick={gate(() => setBuying(true))}
        className={cn(
          'relative flex flex-col overflow-hidden rounded-xl border bg-surface-deep text-left transition-transform duration-300 ease-out',
          soldOut
            ? 'opacity-55'
            : 'cursor-pointer hover:z-10 hover:-translate-y-2 hover:shadow-e4',
          'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
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
        <div className="relative mt-3 flex w-full flex-col gap-1.5 border-t border-border/60 bg-surface-deep/70 px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-body font-bold uppercase">
              {card.name} <span className="ml-0.5 font-medium text-muted-foreground">{card.position}</span>
            </span>
            {stock !== undefined && (
              <span className={cn('text-micro whitespace-nowrap', soldOut ? 'font-bold text-danger' : 'text-muted-foreground')}>
                {soldOut ? 'Sold out' : `${stock} left`}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-caption font-bold whitespace-nowrap">
              <Image src="/coin.png" alt="" width={14} height={14} className="size-3.5" />
              {price}
            </span>
            <span className={cn('text-[0.5625rem] leading-3 font-semibold tracking-wider whitespace-nowrap uppercase', theme.badgeClass)}>
              {theme.label}
            </span>
          </div>
        </div>
      </button>

      <PickBuyDialog open={buying} onOpenChange={setBuying} card={card} price={price} />
    </>
  );
}
