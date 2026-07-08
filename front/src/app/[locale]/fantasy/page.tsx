'use client';

import Link from 'next/link';
import { Package, ArrowsLeftRight } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { CoinBalance } from '@/components/common/coin-balance';
import { buttonVariants } from '@/components/ui/button';
import { WelcomePackPanel } from '@/components/fantasy/welcome-pack-panel';
import { CollectionGrid } from '@/components/fantasy/collection-grid';
import { XiBuilder } from '@/components/fantasy/xi-builder';
import { FindMatchCta } from '@/components/fantasy/find-match-cta';
import { useFantasyStore } from '@/store/fantasy.store';

export default function FantasyPage() {
  const collection = useFantasyStore((s) => s.collection);
  const hasCards = collection.length > 0;

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Fantasy</h1>
            <p className="text-sm text-muted-foreground">
              Open packs, build your XI, and face other managers in attribute-driven matches.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CoinBalance showAdd={false} />
            <Link href="/store" className={buttonVariants({ variant: 'outline' })}>
              <Package className="size-4" /> Get packs
            </Link>
          </div>
        </header>

        {!hasCards && <WelcomePackPanel />}

        {hasCards && (
          <>
            <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
              <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
                <SectionHeader
                  title="Your collection"
                  action={<span className="text-micro text-muted-foreground">{collection.length} players</span>}
                />
                <CollectionGrid />
              </GlassPanel>
              <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
                <SectionHeader title="Starting XI" />
                <XiBuilder />
              </GlassPanel>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FindMatchCta />
              <Link href="/fantasy/market" className="block">
                <GlassPanel radius="xl" tone="surface" className="flex h-full items-center gap-4 p-5 transition hover:border-neon/40">
                  <ArrowsLeftRight className="size-8 text-neon" />
                  <div className="flex flex-1 flex-col">
                    <span className="font-bold">Player market</span>
                    <span className="text-xs text-muted-foreground">Buy, sell and trade with other managers.</span>
                  </div>
                </GlassPanel>
              </Link>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
