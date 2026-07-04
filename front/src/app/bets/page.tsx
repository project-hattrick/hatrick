import Link from 'next/link';
import { Ticket, Clock } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { WireBlock } from '@/components/common/wire-block';
import { buttonVariants } from '@/components/ui/button';

const tabs = ['Open', 'Settled', 'Predictions'];

export default function BetsPage() {
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

          <div className="flex gap-2">
            {tabs.map((tab, i) => (
              <span
                key={tab}
                className={
                  i === 0
                    ? 'rounded-full bg-neon px-3 py-1 text-xs font-bold text-primary-foreground'
                    : 'rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground'
                }
              >
                {tab}
              </span>
            ))}
          </div>

          <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
            <SectionHeader title="Open bets" action={<Ticket className="size-3.5 text-neon" />} />
            <div className="flex flex-col gap-2 p-4 pt-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <WireBlock key={i} label="Bet row — match · market · selection · stake · odds · potential return" className="h-14" />
              ))}
            </div>
          </GlassPanel>
        </div>

        <div className="flex flex-col gap-4">
          <GlassPanel radius="xl" tone="dark" className="overflow-hidden">
            <SectionHeader title="Bet slip" />
            <div className="flex flex-col gap-3 p-4 pt-0">
              <WireBlock label="Selection · odds" className="h-12" />
              <WireBlock label="Stake input" className="h-10" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Potential return</span>
                <span className="font-bold text-neon">—</span>
              </div>
              <button className={buttonVariants({ variant: 'default', className: 'w-full' })}>Place bet</button>
            </div>
          </GlassPanel>

          <GlassPanel radius="lg" tone="surface" className="flex items-start gap-2 p-4 text-xs text-muted-foreground">
            <Clock className="mt-0.5 size-4 shrink-0" />
            Bets settle automatically on the authoritative match event. Devnet · play-money only.
          </GlassPanel>
        </div>
      </div>
    </PageShell>
  );
}
