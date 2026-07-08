'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { CoinBalance } from '@/components/common/coin-balance';
import { buttonVariants } from '@/components/ui/button';
import { MarketCard } from '@/components/market/market-card';
import { BuyDialog } from '@/components/market/buy-dialog';
import { SellDialog } from '@/components/market/sell-dialog';
import { useListings } from '@/store/market.store';
import { useFantasyStore } from '@/store/fantasy.store';
import { priceFor, type Listing } from '@/config/market-listings.config';
import type { PackCard } from '@/config/pack-pool.config';

export default function MarketPage() {
  const listings = useListings();
  const collection = useFantasyStore((s) => s.collection);
  const [buyTarget, setBuyTarget] = useState<Listing | null>(null);
  const [sellTarget, setSellTarget] = useState<PackCard | null>(null);

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link href="/fantasy" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-3.5" /> Back to Fantasy
            </Link>
            <h1 className="text-2xl font-bold">Player market</h1>
            <p className="text-sm text-muted-foreground">Buy and sell players with play-money coins.</p>
          </div>
          <CoinBalance />
        </header>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader
            title="Listings"
            action={<span className="text-micro text-muted-foreground">{listings.length} for sale</span>}
          />
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-5">
            {listings.map((listing) => (
              <MarketCard
                key={listing.id}
                card={listing.card}
                price={listing.price}
                actionLabel="Buy"
                onAction={() => setBuyTarget(listing)}
              />
            ))}
          </div>
        </GlassPanel>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader
            title="Your players"
            action={<span className="text-micro text-muted-foreground">{collection.length} owned</span>}
          />
          {collection.length ? (
            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-5">
              {collection.map((card, i) => (
                <MarketCard
                  key={`${card.name}-${i}`}
                  card={card}
                  price={priceFor(card)}
                  actionLabel="Sell"
                  onAction={() => setSellTarget(card)}
                />
              ))}
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No players to sell —{' '}
              <Link href="/store" className="text-neon">
                open a pack
              </Link>
              .
            </p>
          )}
        </GlassPanel>
      </div>

      <BuyDialog listing={buyTarget} onOpenChange={(open) => !open && setBuyTarget(null)} />
      <SellDialog card={sellTarget} onOpenChange={(open) => !open && setSellTarget(null)} />
    </PageShell>
  );
}
