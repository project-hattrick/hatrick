import { ChartBar, Package, Stack, type Icon } from '@/components/common/icons';
import { SiteNavbar } from '@/components/common/site-navbar';
import { SiteFooter } from '@/components/home/site-footer';
import { StoreHero } from '@/components/store/store-hero';
import { StorePackTile, type StorePack } from '@/components/store/store-pack-tile';
import { BundleCard } from '@/components/store/bundle-card';
import { MarketPickCard } from '@/components/store/market-pick-card';
import { storeBundles } from '@/config/store-bundles.config';
import { userCards } from '@/config/fantasy-cards.config';

const storePacks: StorePack[] = [
  {
    slug: 'legendary-pack',
    name: 'Legendary Pack',
    players: 5,
    price: '2.0 SOL',
    label: 'Featured drop',
    caption: '5 players guaranteed, at least one rated 90+.',
    highlight: true,
  },
  { slug: 'pro-pack', name: 'Pro Pack', players: 11, price: '1.2 SOL', label: 'Top pick', caption: 'Top tier odds. More stars.' },
  { slug: 'starter-pack', name: 'Starter Pack', players: 7, price: '0.5 SOL', label: 'Great start', caption: 'Build your squad.' },
];

/** Highest-rated cards first — the "market picks" strip. */
const marketPicks = [...userCards].sort((a, b) => b.rating - a.rating);

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

      {/* Arena banner with the TEAM STORE wordmark — sections below overlap its floor. */}
      <StoreHero />

      <div className="relative z-10 -mt-20 px-6 pb-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          {/* Packs */}
          <section className="flex flex-col gap-3">
            <SectionHeading icon={Package} label="Packs" />
            <div className="grid gap-4 md:grid-cols-3">
              {storePacks.map((pack) => (
                <StorePackTile key={pack.name} pack={pack} />
              ))}
            </div>
          </section>

          {/* Bundles */}
          <section className="flex flex-col gap-3">
            <SectionHeading icon={Stack} label="Bundles" />
            <div className="grid gap-4 md:grid-cols-2">
              {storeBundles.map((bundle) => (
                <BundleCard key={bundle.name} bundle={bundle} />
              ))}
            </div>
          </section>

          {/* Market picks */}
          <section className="flex flex-col gap-3">
            <SectionHeading icon={ChartBar} label="Market picks" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {marketPicks.map((card) => (
                <MarketPickCard key={card.id} card={card} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Footer dimmed so the premium store stays the focus — restores on hover. */}
      <div className="opacity-60 transition-opacity duration-300 hover:opacity-100">
        <SiteFooter />
      </div>
    </div>
  );
}
