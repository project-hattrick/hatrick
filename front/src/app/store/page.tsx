import Image from 'next/image';
import {
  ArrowsLeftRight,
  CheckCircle,
  Package,
  Plus,
  ShieldCheck,
  Sparkle,
  Ticket,
  TrendUp,
  Users,
  type Icon,
} from '@/components/common/icons';
import { SiteNavbar } from '@/components/common/site-navbar';
import { SiteFooter } from '@/components/home/site-footer';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { PackOpening } from '@/components/store/pack-opening';
import { formatThousands } from '@/lib/format';

const packs = [
  { name: 'Starter Pack', players: 7, price: '0.5 SOL' },
  { name: 'Pro Pack', players: 11, price: '1.2 SOL' },
  { name: 'Legendary Pack', players: 5, price: '2.0 SOL' },
];

const trustBadges: { icon: Icon; title: string; caption: string }[] = [
  { icon: Package, title: 'Official Packs', caption: 'Curated by Hat-trick' },
  { icon: CheckCircle, title: 'Fair & Transparent', caption: 'Provably fair odds' },
  { icon: ShieldCheck, title: 'Secure Checkout', caption: 'Safe and trusted' },
];

const marketFeatures: { icon: Icon; label: string }[] = [
  { icon: Ticket, label: 'List & sell your players' },
  { icon: ShieldCheck, label: 'Safe trades on-chain' },
  { icon: TrendUp, label: 'Real value player economy' },
];

/** The real foil pack render (trimmed), with a plain dark drop shadow. */
function PackArt() {
  return (
    <Image
      src="/cards/pack-foil.png"
      alt=""
      width={660}
      height={1122}
      className="h-44 w-auto shrink-0 drop-shadow-[0_14px_24px_rgba(0,0,0,0.65)]"
    />
  );
}

export default function StorePage() {
  return (
    <div className="relative min-h-screen bg-background select-none [&_img]:pointer-events-none [&_img]:[-webkit-user-drag:none]">
      <SiteNavbar />

      <main className="relative px-6 pt-24 pb-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold md:text-5xl">Store</h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Build your squad. Open packs. Find legends.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-surface-2/80 py-1.5 pr-1.5 pl-3">
              <Image src="/coin.png" alt="Coins" width={18} height={18} className="size-4" />
              <span className="text-sm font-bold tabular-nums">{formatThousands(28_105_820)}</span>
              <span className="grid size-6 place-items-center rounded-full bg-neon text-black">
                <Plus className="size-3.5" />
              </span>
            </div>
          </header>

          <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
            {trustBadges.map((badge) => (
              <div key={badge.title} className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full border border-border/60 bg-surface-2/70 text-neon">
                  <badge.icon className="size-4" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-bold">{badge.title}</span>
                  <span className="text-xs text-muted-foreground">{badge.caption}</span>
                </span>
              </div>
            ))}
          </div>

          <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
            <SectionHeader title="Featured packs" action={<Sparkle className="size-3.5 text-neon" />} />
            <div className="grid gap-4 p-4 pt-0 md:grid-cols-3">
              {packs.map((pack) => (
                <GlassPanel key={pack.name} radius="lg" tone="dark" className="flex items-center gap-4 p-5">
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <h3 className="text-lg font-bold">{pack.name}</h3>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="size-3.5" />
                      {pack.players} players
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-bold text-neon">
                      <Image src="/coin.png" alt="" width={16} height={16} />
                      {pack.price}
                    </span>
                    <PackOpening packName={pack.name} />
                  </div>
                  <PackArt />
                </GlassPanel>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel radius="xl" tone="surface" className="flex flex-col gap-5 p-6 md:flex-row md:items-center">
            <ArrowsLeftRight className="size-9 shrink-0 text-neon" />
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <h2 className="text-xl font-bold">Player market</h2>
                <p className="text-sm text-muted-foreground">Trade players peer-to-peer. Coming in a later phase.</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                {marketFeatures.map((feature) => (
                  <span key={feature.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <feature.icon className="size-4 text-neon" />
                    {feature.label}
                  </span>
                ))}
              </div>
            </div>
            <span className="self-start rounded-full border border-border/60 bg-surface-2/70 px-3 py-1 text-xs text-muted-foreground md:self-center">
              Soon
            </span>
          </GlassPanel>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
