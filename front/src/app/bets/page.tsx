'use client';

import Link from 'next/link';
import { Clock } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { buttonVariants } from '@/components/ui/button';
import { BetRow } from '@/components/live/bet-row';
import { MarketsPanel } from '@/components/live/markets-panel';
import { BetSlip } from '@/components/live/bet-slip';
import { PredictionsList } from '@/components/live/predictions-list';
import { useOpenBets, useSettledBets } from '@/store/bets.store';
import type { Bet } from '@/types/bet';

function BetList({ bets, empty }: { bets: Bet[]; empty: string }) {
  if (!bets.length) return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex flex-col divide-y divide-border/30">
      {bets.map((bet) => (
        <BetRow key={bet.id} bet={bet} />
      ))}
    </div>
  );
}

export default function BetsPage() {
  const open = useOpenBets();
  const settled = useSettledBets();

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          <header className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">My bets</h1>
            <Link href="/fixtures" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Find a match
            </Link>
          </header>

          <Tabs defaultValue="open">
            <TabsList>
              <TabsTrigger value="open">Open · {open.length}</TabsTrigger>
              <TabsTrigger value="settled">Settled · {settled.length}</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
            </TabsList>

            <TabsContent value="open">
              <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
                <BetList bets={open} empty="No open bets — pick a selection to get started." />
              </GlassPanel>
            </TabsContent>
            <TabsContent value="settled">
              <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
                <BetList bets={settled} empty="No settled bets yet." />
              </GlassPanel>
            </TabsContent>
            <TabsContent value="predictions">
              <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
                <PredictionsList />
              </GlassPanel>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-col gap-4">
          <BetSlip />
          <MarketsPanel />
          <GlassPanel radius="lg" tone="surface" className="flex items-start gap-2 p-4 text-xs text-muted-foreground">
            <Clock className="mt-0.5 size-4 shrink-0" />
            Bets settle automatically on the authoritative match event. Devnet · play-money only.
          </GlassPanel>
        </div>
      </div>
    </PageShell>
  );
}
