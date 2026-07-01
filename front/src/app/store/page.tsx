import Image from 'next/image';
import { ShoppingCart, ArrowsLeftRight } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { WireBlock } from '@/components/common/wire-block';
import { Button } from '@/components/ui/button';
import { formatThousands } from '@/lib/format';

const packs = [
  { name: 'Starter Pack', players: 7, price: '0.5 SOL' },
  { name: 'Pro Pack', players: 11, price: '1.2 SOL' },
  { name: 'Legendary Pack', players: 5, price: '2.0 SOL' },
];

export default function StorePage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Store</h1>
            <p className="text-sm text-muted-foreground">Packs and special cards. Devnet checkout · play-money only.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-surface-2 px-3 py-1.5">
            <Image src="/coin.png" alt="Coins" width={18} height={18} className="size-4" />
            <span className="text-sm font-bold tabular-nums">{formatThousands(28_105_820)}</span>
          </div>
        </header>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader title="Featured packs" action={<ShoppingCart className="size-3.5 text-neon" />} />
          <div className="grid gap-4 p-4 pt-0 md:grid-cols-3">
            {packs.map((pack) => (
              <GlassPanel key={pack.name} radius="lg" tone="dark" className="flex flex-col gap-3 p-4">
                <WireBlock label="Pack art" className="h-32" />
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold">{pack.name}</span>
                    <span className="text-[11px] text-muted-foreground">{pack.players} players</span>
                  </div>
                  <span className="text-sm font-bold text-neon">{pack.price}</span>
                </div>
                <Button className="w-full">Buy pack</Button>
              </GlassPanel>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel radius="xl" tone="surface" className="flex items-center gap-4 p-5">
          <ArrowsLeftRight className="size-8 text-neon" />
          <div className="flex flex-1 flex-col">
            <span className="font-bold">Player market</span>
            <span className="text-xs text-muted-foreground">Trade players peer-to-peer. Coming in a later phase.</span>
          </div>
          <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">Soon</span>
        </GlassPanel>
      </div>
    </PageShell>
  );
}
