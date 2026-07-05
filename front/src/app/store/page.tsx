import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowsLeftRight,
  CheckCircle,
  Package,
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
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { CoinBalance } from '@/components/common/coin-balance';
import { MiniHoloCard } from '@/components/fantasy/mini-holo-card';
import { PackOpening } from '@/components/store/pack-opening';
import { userCards } from '@/config/fantasy-cards.config';
import { cn } from '@/lib/utils';

const featuredDrop = {
  name: 'Legendary Pack',
  players: 5,
  price: '2.0 SOL',
  remainingToday: 128,
  tagline: '5 players guaranteed, at least one rated 90+. Provably fair odds on-chain.',
};

const packs = [
  { name: 'Starter Pack', players: 7, price: '0.5 SOL', highlight: false },
  { name: 'Pro Pack', players: 11, price: '1.2 SOL', highlight: true },
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

/** Highest-rated cards first — the mock "trending on the market" strip. */
const trendingCards = [...userCards].sort((a, b) => b.rating - a.rating);

/** Mock market price scaled from the card rating (≈1.9–2.5 SOL for the star pool). */
const cardPrice = (rating: number): string => `${((rating - 78) / 7.5).toFixed(1)} SOL`;

/** The real foil pack render (trimmed), with a plain dark drop shadow. */
function PackArt({ className }: { className?: string }) {
  return (
    <Image
      src="/cards/pack-foil.png"
      alt=""
      width={660}
      height={1122}
      className={cn('w-auto shrink-0 drop-shadow-[0_14px_24px_rgba(0,0,0,0.65)]', className)}
    />
  );
}

/** Coin icon + price, the shared buy-button content. */
function CoinPrice({ price }: { price: string }) {
  return (
    <>
      <Image src="/coin.png" alt="" width={16} height={16} className="size-4" />
      {price}
    </>
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
              <h1 className="text-display">Store</h1>
              <p className="mt-1 text-body text-muted-foreground">Build your squad. Open packs. Find legends.</p>
            </div>
            <CoinBalance />
          </header>

          {/* Drop of the week — the featured pack hero */}
          <GlassPanel radius="xl" tone="surface" className="relative overflow-hidden border-medal-gold/25">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-medal-gold/10 via-transparent to-transparent" />
            <div className="relative flex flex-col gap-6 p-5 md:flex-row md:items-center md:gap-10 md:p-8">
              <div className="flex flex-1 flex-col items-start gap-4">
                <Badge variant="outline" className="border-medal-gold/40 text-medal-gold">
                  <Sparkle />
                  Drop of the week
                </Badge>
                <div>
                  <h2 className="font-talero text-4xl uppercase md:text-5xl">{featuredDrop.name}</h2>
                  <p className="mt-2 max-w-md text-body text-muted-foreground">{featuredDrop.tagline}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <PackOpening
                    packName={featuredDrop.name}
                    packSize={featuredDrop.players}
                    ctaSize="lg"
                    ctaClassName="px-5"
                    cta={<CoinPrice price={`Buy · ${featuredDrop.price}`} />}
                  />
                  <span className="text-caption text-muted-foreground">
                    <span className="font-bold text-foreground">{featuredDrop.remainingToday}</span> left today
                  </span>
                </div>
              </div>
              <div className="relative self-center md:self-auto">
                <div className="absolute inset-0 -z-0 scale-90 rounded-full bg-medal-gold/15 blur-3xl" />
                <PackArt className="relative h-52 md:h-60" />
              </div>
            </div>
          </GlassPanel>

          {/* Standard packs */}
          <div className="grid gap-4 md:grid-cols-2">
            {packs.map((pack) => (
              <GlassPanel
                key={pack.name}
                radius="lg"
                tone="dark"
                className={cn('flex items-center gap-4 p-5', pack.highlight && 'border-neon/30')}
              >
                <PackArt className="h-20" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h3 className="text-lead font-bold">{pack.name}</h3>
                  <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
                    <Users className="size-3.5" />
                    {pack.players} players
                  </span>
                </div>
                <PackOpening
                  packName={pack.name}
                  packSize={pack.players}
                  ctaVariant={pack.highlight ? 'default' : 'secondary'}
                  cta={<CoinPrice price={pack.price} />}
                />
              </GlassPanel>
            ))}
          </div>

          {/* Trending players */}
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-eyebrow text-muted-foreground">Trending now</span>
              <a href="#market" className="flex items-center gap-1 text-caption font-semibold text-neon">
                View market
                <ArrowRight className="size-3.5" />
              </a>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {trendingCards.map((card) => (
                <div key={card.id} className="flex w-40 shrink-0 flex-col gap-2">
                  <MiniHoloCard card={card} className="w-40" />
                  <Badge variant="secondary" className="h-8 w-full rounded-lg text-sm font-semibold">
                    <CoinPrice price={cardPrice(card.rating)} />
                  </Badge>
                </div>
              ))}
            </div>
          </section>

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

          <GlassPanel
            id="market"
            radius="xl"
            tone="surface"
            className="flex scroll-mt-24 flex-col gap-5 p-5 md:flex-row md:items-center"
          >
            <ArrowsLeftRight className="size-9 shrink-0 text-neon" />
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <h2 className="text-title">Player market</h2>
                <p className="text-body text-muted-foreground">Trade players peer-to-peer with play-money coins.</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                {marketFeatures.map((feature) => (
                  <span key={feature.label} className="flex items-center gap-2 text-caption text-muted-foreground">
                    <feature.icon className="size-4 text-neon" />
                    {feature.label}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/fantasy/market" className={cn(buttonVariants({ variant: 'default' }), 'self-start md:self-center')}>
              Open market
            </Link>
          </GlassPanel>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
