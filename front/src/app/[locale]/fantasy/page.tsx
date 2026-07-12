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
import { useI18n, useT } from '@/i18n/i18n-provider';
import { localizePath } from '@/i18n/path';

export default function FantasyPage() {
  const t = useT();
  const { locale } = useI18n();
  const collection = useFantasyStore((s) => s.collection);
  const hasCards = collection.length > 0;

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('pages.fantasy.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('pages.fantasy.intro')}</p>
          </div>
          <div className="flex items-center gap-3">
            <CoinBalance showAdd={false} />
            <Link href={localizePath('/store', locale)} className={buttonVariants({ variant: 'outline' })}>
              <Package className="size-4" /> {t('pages.fantasy.getPacks')}
            </Link>
          </div>
        </header>

        {!hasCards && <WelcomePackPanel />}

        {hasCards && (
          <>
            <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
              <GlassPanel radius="xl" tone="surface" className="flex flex-col overflow-hidden">
                <SectionHeader
                  title={t('pages.fantasy.collection')}
                  action={<span className="text-micro text-muted-foreground">{t('pages.fantasy.players', { count: collection.length })}</span>}
                />
                <CollectionGrid />
              </GlassPanel>
              <GlassPanel radius="xl" tone="surface" className="flex flex-col overflow-hidden">
                <SectionHeader title={t('pages.fantasy.startingXi')} />
                <XiBuilder />
              </GlassPanel>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FindMatchCta />
              <Link href={localizePath('/fantasy/market', locale)} className="block">
                <GlassPanel radius="xl" tone="surface" className="flex h-full items-center gap-4 p-5 transition hover:border-neon/40">
                  <ArrowsLeftRight className="size-8 text-neon" />
                  <div className="flex flex-1 flex-col">
                    <span className="font-bold">{t('pages.fantasy.market')}</span>
                    <span className="text-xs text-muted-foreground">{t('pages.fantasy.marketIntro')}</span>
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
