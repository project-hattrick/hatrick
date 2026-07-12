'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { CoinBalance } from '@/components/common/coin-balance';
import { MarketCard } from '@/components/market/market-card';
import { BuyDialog } from '@/components/market/buy-dialog';
import { SellDialog } from '@/components/market/sell-dialog';
import { useListings } from '@/store/market.store';
import { useFantasyStore } from '@/store/fantasy.store';
import { priceFor, type Listing } from '@/config/market-listings.config';
import type { PackCard } from '@/config/pack-pool.config';
import { useI18n, useT } from '@/i18n/i18n-provider';
import { localizePath } from '@/i18n/path';

export default function MarketPage() {
  const t = useT();
  const { locale } = useI18n();
  const listings = useListings();
  const collection = useFantasyStore((s) => s.collection);
  const [buyTarget, setBuyTarget] = useState<Listing | null>(null);
  const [sellTarget, setSellTarget] = useState<PackCard | null>(null);

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link href={localizePath('/fantasy', locale)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-3.5" /> {t('pages.market.back')}
            </Link>
            <h1 className="text-2xl font-bold">{t('pages.market.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('pages.market.intro')}</p>
          </div>
          <CoinBalance />
        </header>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader
            title={t('pages.market.listings')}
            action={<span className="text-micro text-muted-foreground">{t('pages.market.forSale', { count: listings.length })}</span>}
          />
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-5">
            {listings.map((listing) => (
              <MarketCard
                key={listing.id}
                card={listing.card}
                price={listing.price}
                actionLabel={t('pages.market.buy')}
                onAction={() => setBuyTarget(listing)}
              />
            ))}
          </div>
        </GlassPanel>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader
            title={t('pages.market.yourPlayers')}
            action={<span className="text-micro text-muted-foreground">{t('pages.market.owned', { count: collection.length })}</span>}
          />
          {collection.length ? (
            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-5">
              {collection.map((card, i) => (
                <MarketCard
                  key={`${card.name}-${i}`}
                  card={card}
                  price={priceFor(card)}
                  actionLabel={t('pages.market.sell')}
                  onAction={() => setSellTarget(card)}
                />
              ))}
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t('pages.market.emptyPrefix')}{' '}
              <Link href={localizePath('/store', locale)} className="text-neon">
                {t('pages.market.openPack')}
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
