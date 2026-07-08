import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CaretRight, ChartBar, Eye, Stack, type Icon } from '@/components/common/icons';
import { SiteNavbar } from '@/components/common/site-navbar';
import { SiteFooter } from '@/components/home/site-footer';
import { GlassPanel, glassPanelVariants } from '@/components/common/glass-panel';
import { Flag } from '@/components/common/flag';
import { ParallaxPack } from '@/components/store/parallax-pack';
import { BuyPackFlow } from '@/components/store/buy-pack-flow';
import { BundleCard, type Bundle } from '@/components/store/bundle-card';
import { BadgeTone } from '@/components/store/store-badge';
import { INTERACTIVE_CARD, REVEAL_ON_HOVER } from '@/components/store/interactive-card';
import { userCards } from '@/config/fantasy-cards.config';
import { cn } from '@/lib/utils';

/** Same backdrop as the pack-opening overlay — the featured drop wears the opening stage. */
const OPENING_BG = "url('/cards/stadium-podium.png')";

const featuredDrop = {
  name: 'Legendary Pack',
  players: 5,
  price: '2.0 SOL',
  remainingToday: 126,
  tagline: '5 players guaranteed, at least one rated 90+. Provably fair odds.',
};

/** Side packs stacked next to the featured drop. */
const sidePacks = [
  { name: 'Pro Pack', label: 'Top pick', players: 11, price: '1.2 SOL', caption: 'Top tier odds. More stars.', highlight: true },
  { name: 'Starter Pack', label: 'Great start', players: 7, price: '0.5 SOL', caption: 'Build your squad.', highlight: false },
];

const bundles: Bundle[] = [
  { name: 'Limited Bundle', caption: 'Elite players. Limited time.', price: '3.5 SOL', tag: { text: 'Hot', tone: BadgeTone.Hot } },
  { name: 'Midfield Bundle', caption: 'Balance your squad.', price: '2.5 SOL', tag: { text: 'New', tone: BadgeTone.Value } },
  { name: 'Attack Bundle', caption: 'Attack heavy. High upside.', price: '2.5 SOL', soldOut: true },
];

/** Highest-rated cards first — the "market picks" strip. */
const marketPicks = [...userCards].sort((a, b) => b.rating - a.rating);

/** Mock market price scaled from the card rating (≈1.9–2.5 SOL for the star pool). */
const cardPrice = (rating: number): string => `${((rating - 78) / 7.5).toFixed(1)} SOL`;

/** Coin icon + price, the shared buy-button content. */
function CoinPrice({ price }: { price: string }) {
  return (
    <>
      <Image src="/coin.png" alt="" width={16} height={16} className="size-4" />
      {price}
    </>
  );
}

/** Section heading: green duotone icon + uppercase label, with optional trailing action. */
function SectionHeading({ icon: SectionIcon, label, action }: { icon: Icon; label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <SectionIcon className="size-5 text-neon" weight="fill" />
        <h2 className="text-eyebrow text-foreground">{label}</h2>
      </div>
      {action}
    </div>
  );
}

export default function StorePage() {
  return (
    <div className="relative min-h-screen bg-background select-none [&_img]:pointer-events-none [&_img]:[-webkit-user-drag:none]">
      <SiteNavbar />

      <main className="relative px-6 pt-24 pb-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <h1 className="sr-only">Store</h1>

          {/* Featured drop + side packs */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Featured Legendary Pack — wears the pack-opening backdrop */}
            <GlassPanel
              radius="xl"
              tone="dark"
              className={cn(
                'relative overflow-hidden border-neon/20 bg-surface-deep bg-cover bg-center lg:col-span-2',
                INTERACTIVE_CARD,
              )}
              style={{ backgroundImage: OPENING_BG }}
            >
              {/* Heavy black overlay — the stadium backdrop stays barely visible. */}
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-overlay/80" />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/80 via-background/30 to-transparent" />
              <div className="relative flex flex-col items-center gap-6 p-5 md:flex-row md:gap-8 md:p-8">
                <div className="shrink-0">
                  <ParallaxPack className="h-64 transition-transform duration-200 group-hover:scale-[1.03] md:h-80" glow />
                </div>
                <div className="flex flex-1 flex-col items-start gap-4">
                  <span className="flex items-center gap-1 text-eyebrow text-neon">
                    Featured drop <CaretRight className="size-3.5" weight="bold" />
                  </span>
                  <div className="flex flex-col gap-2">
                    <h2 className="font-talero text-4xl leading-none uppercase md:text-6xl">{featuredDrop.name}</h2>
                    <p className="max-w-sm text-body text-muted-foreground">{featuredDrop.tagline}</p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-3">
                    <BuyPackFlow
                      packName={featuredDrop.name}
                      packSize={featuredDrop.players}
                      price={featuredDrop.price}
                      tagline={featuredDrop.tagline}
                      ctaSize="lg"
                      ctaClassName="px-6 text-base font-bold"
                      cta={<CoinPrice price={`Buy · ${featuredDrop.price}`} />}
                      showOdds
                    />
                    <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
                      <span aria-hidden className="size-1.5 rounded-full bg-neon" />
                      <span className="font-semibold text-foreground">{featuredDrop.remainingToday}</span> left today
                    </span>
                  </div>
                </div>
              </div>
            </GlassPanel>

            {/* Side packs */}
            <div className="flex flex-col gap-4">
              {sidePacks.map((pack) => (
                <GlassPanel
                  key={pack.name}
                  radius="xl"
                  tone="surface"
                  className={cn('flex flex-1 items-center gap-5 p-5', INTERACTIVE_CARD, pack.highlight && 'border-neon/25')}
                >
                  <ParallaxPack
                    className="h-32 shrink-0 transition-transform duration-200 group-hover:scale-[1.05] md:h-40"
                    restTilt={{ rx: 4, ry: -14 }}
                    tiltRange={10}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className={cn('text-eyebrow', pack.highlight ? 'text-neon' : 'text-muted-foreground')}>{pack.label}</span>
                    <h3 className="text-title uppercase">{pack.name}</h3>
                    <p className="text-caption text-muted-foreground">{pack.caption}</p>
                    <BuyPackFlow
                      packName={pack.name}
                      packSize={pack.players}
                      price={pack.price}
                      tagline={pack.caption}
                      ctaVariant="secondary"
                      ctaSize="sm"
                      ctaClassName="font-semibold"
                      cta={<CoinPrice price={`Buy · ${pack.price}`} />}
                      showOdds
                      oddsReveal
                      actionsClassName="mt-3"
                    />
                  </div>
                </GlassPanel>
              ))}
            </div>
          </div>

          {/* Bundles */}
          <section className="flex flex-col gap-3">
            <SectionHeading icon={Stack} label="Bundles" />
            <div className="grid gap-4 md:grid-cols-3">
              {bundles.map((bundle) => (
                <BundleCard key={bundle.name} bundle={bundle} />
              ))}
            </div>
          </section>

          {/* Market picks */}
          <section className="flex flex-col gap-3">
            <SectionHeading
              icon={ChartBar}
              label="Market picks"
              action={
                <Link href="/fantasy/market" className="flex items-center gap-1 text-caption font-semibold text-neon">
                  View market
                  <ArrowRight className="size-3.5" weight="bold" />
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {marketPicks.map((card) => (
                <Link
                  key={card.id}
                  href="/fantasy/market"
                  className={cn(glassPanelVariants({ tone: 'dark', radius: 'lg' }), INTERACTIVE_CARD, 'relative flex flex-col overflow-hidden p-3')}
                >
                  <div className="relative flex items-start justify-between gap-1">
                    <div className="z-10 flex flex-col gap-1 leading-none">
                      <span className="font-talero text-3xl text-foreground [text-shadow:0_1px_4px_rgb(0_0_0/0.7)]">{card.rating}</span>
                      <Flag code={card.code} className="text-sm" />
                    </div>
                    <div className="relative -mt-2 h-36 w-28 shrink-0">
                      <Image
                        src={card.portraitSrc}
                        alt={card.name}
                        fill
                        sizes="112px"
                        className="object-contain object-bottom transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-110"
                      />
                    </div>
                  </div>
                  <div className="mt-1 border-t border-border/60 pt-2">
                    <p className="truncate text-body font-bold uppercase">{card.name}</p>
                    <p className="text-micro text-muted-foreground">{card.position}</p>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1.5 text-caption font-bold">
                        <Image src="/coin.png" alt="" width={14} height={14} className="size-3.5" />
                        {cardPrice(card.rating)}
                      </span>
                      <span className={cn('flex items-center gap-1 text-micro font-bold text-neon', REVEAL_ON_HOVER)}>
                        <Eye className="size-3.5" weight="bold" />
                        View
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer dimmed so the premium store stays the focus — restores on hover. */}
      <div className="opacity-60 transition-opacity duration-300 hover:opacity-100">
        <SiteFooter />
      </div>
    </div>
  );
}
