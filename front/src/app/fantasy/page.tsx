import Link from 'next/link';
import { Package, Users, ArrowsLeftRight, Sword, Sparkle } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { WireBlock } from '@/components/common/wire-block';
import { Button, buttonVariants } from '@/components/ui/button';

export default function FantasyPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Fantasy</h1>
            <p className="text-sm text-muted-foreground">
              Open packs, build your XI, and face other managers in attribute-driven matches.
            </p>
          </div>
          <Link href="/store" className={buttonVariants({ variant: 'outline' })}>
            <Package className="size-4" /> Get packs
          </Link>
        </header>

        <GlassPanel radius="xl" tone="dark" className="overflow-hidden p-6">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-neon uppercase">
                <Sparkle className="size-3.5" /> Welcome pack
              </span>
              <h2 className="text-xl font-bold">Open your pack of 7 players</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Reveal real players with live, evolving attributes. Build your squad from what you pull.
              </p>
            </div>
            <Button size="lg">Open pack</Button>
          </div>
          <WireBlock label="Pack opening animation (dialog)" className="mt-5 h-28" />
        </GlassPanel>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
            <SectionHeader title="Your collection" action={<span className="text-[10px] text-muted-foreground">7 players</span>} />
            <div className="grid grid-cols-3 gap-3 p-4 pt-0 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <WireBlock key={i} label="Player card" className="h-32" />
              ))}
            </div>
          </GlassPanel>
          <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
            <SectionHeader title="XI builder" action={<Users className="size-3.5 text-neon" />} />
            <WireBlock label="Formation pitch · drag players into 11 slots" className="m-4 h-56" />
          </GlassPanel>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <GlassPanel radius="xl" tone="surface" className="flex items-center gap-4 p-5">
            <Sword className="size-8 text-neon" />
            <div className="flex flex-1 flex-col">
              <span className="font-bold">1v1 simulated match</span>
              <span className="text-xs text-muted-foreground">3D AI-driven match from real attributes.</span>
            </div>
            <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">Soon</span>
          </GlassPanel>
          <GlassPanel radius="xl" tone="surface" className="flex items-center gap-4 p-5">
            <ArrowsLeftRight className="size-8 text-neon" />
            <div className="flex flex-1 flex-col">
              <span className="font-bold">Player market</span>
              <span className="text-xs text-muted-foreground">Buy, sell and trade with other managers.</span>
            </div>
            <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">Soon</span>
          </GlassPanel>
        </div>
      </div>
    </PageShell>
  );
}
