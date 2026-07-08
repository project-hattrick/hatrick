import Link from 'next/link';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { buildMetadata, SITE } from '@/lib/seo';
import {
  Broadcast,
  GameController,
  Lightning,
  Globe,
  ShieldCheck,
  Trophy,
  TrendUp,
  Users,
  type Icon,
} from '@/components/common/icons';
import { Button } from '@/components/ui/button';

export const metadata = buildMetadata({
  title: 'About',
  description:
    'Hat-trick is a dual-mode World Cup platform: predict live matches in real time or build your XI and duel friends 1v1, all powered by the TxLINE feed.',
  path: '/about',
});

interface ModeCard {
  icon: Icon;
  label: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  accent: string;
}

const modes: ModeCard[] = [
  {
    icon: Broadcast,
    label: 'Live Mode',
    title: 'Real matches, real stakes',
    body: 'Follow every World Cup match as it happens. The TxLINE feed delivers goals, cards and substitutions in milliseconds. Place predictions on live markets and watch your balance react to the action on the pitch.',
    href: '/live',
    cta: 'Go to Live',
    accent: 'text-live',
  },
  {
    icon: GameController,
    label: 'Fantasy Mode',
    title: 'Your XI, your rules',
    body: 'Assemble a squad of real World Cup players whose attribute scores update after every confirmed match event. Then pick a rival from the Duelists directory and send a 1v1 challenge — the 2D arena settles the score.',
    href: '/fantasy',
    cta: 'Build your squad',
    accent: 'text-neon',
  },
];

interface ValueItem {
  icon: Icon;
  title: string;
  body: string;
}

const values: ValueItem[] = [
  {
    icon: Lightning,
    title: 'Real-time everything',
    body: 'Every goal, card, and substitution from the TxLINE feed flows into Live odds and Fantasy attribute updates within milliseconds.',
  },
  {
    icon: Trophy,
    title: 'Competitive by design',
    body: 'From ranked 1v1 duels to live-market predictions, Hat-trick is built for players who want to test their football knowledge against real opponents.',
  },
  {
    icon: Globe,
    title: 'Global stage',
    body: '32 teams, 64 matches, one platform. Every World Cup fixture is a new opportunity — in Live, Fantasy, or both.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent & fair',
    body: 'Settlements happen on Solana Devnet and are verifiable on-chain. Play-money only — no real funds, no hidden mechanics.',
  },
  {
    icon: TrendUp,
    title: 'Data-driven attributes',
    body: 'Player ratings are not guesses. They reflect real performance metrics: goals, assists, key passes, tackles, saves — recalculated match by match.',
  },
  {
    icon: Users,
    title: 'Social at the core',
    body: 'Add friends, challenge rivals, and track head-to-head records. The Duelists directory puts the entire Hat-trick community a search away.',
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="py-8 md:py-14">
        <div className="hero-ambient absolute inset-0 pointer-events-none" aria-hidden />
        <div className="relative flex flex-col gap-5">
          <span className="text-eyebrow text-neon">{SITE.name}</span>
          <h1 className="text-display max-w-2xl text-foreground">
            One platform, two ways to live the World Cup
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {SITE.description}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button render={<Link href="/live" />} shape="pill" size="lg">
              Watch Live
            </Button>
            <Button render={<Link href="/fantasy" />} variant="outline" shape="pill" size="lg">
              Build Your XI
            </Button>
          </div>
        </div>
      </section>

      {/* Two modes */}
      <section className="py-8">
        <h2 className="text-title mb-6 text-foreground">Choose your mode</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {modes.map((mode) => {
            const ModeIcon = mode.icon;
            return (
              <GlassPanel key={mode.label} tone="surface" className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <ModeIcon className={`size-6 ${mode.accent}`} />
                  <span className={`text-eyebrow ${mode.accent}`}>{mode.label}</span>
                </div>
                <h3 className="text-title text-foreground">{mode.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{mode.body}</p>
                <Link
                  href={mode.href}
                  className={`mt-auto text-sm font-semibold underline-offset-4 hover:underline ${mode.accent}`}
                >
                  {mode.cta} →
                </Link>
              </GlassPanel>
            );
          })}
        </div>
      </section>

      {/* TxLINE vision */}
      <section className="py-8">
        <GlassPanel tone="dark" className="flex flex-col gap-4 p-6 md:p-8">
          <span className="text-eyebrow text-muted-foreground">Powered by</span>
          <h2 className="text-title text-foreground">TxLINE — the real-time feed</h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Every event you see on Hat-trick originates from TxLINE, a secured Server-Sent Events
            stream that delivers confirmed match data within milliseconds of the whistle. Goals
            settle your bets. Assists bump your player&apos;s rating. Red cards change the match
            simulation. TxLINE is the single source of truth that keeps Live and Fantasy
            in lockstep with reality.
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {['Match events', 'Player stats', 'Market settlement', 'Attribute recalculation'].map(
              (tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border/50 bg-surface-2/60 px-3 py-1"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
        </GlassPanel>
      </section>

      {/* Values grid */}
      <section className="py-8">
        <h2 className="text-title mb-6 text-foreground">Our values</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value) => {
            const ValueIcon = value.icon;
            return (
              <GlassPanel
                key={value.title}
                tone="blur"
                className="flex flex-col gap-3 p-5"
              >
                <ValueIcon className="size-5 text-neon" />
                <h3 className="text-sm font-bold text-foreground">{value.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{value.body}</p>
              </GlassPanel>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 text-center">
        <h2 className="text-title mb-3 text-foreground">Ready to play?</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Connect your Solana wallet and step into the World Cup.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button render={<Link href="/live" />} shape="pill" size="lg">
            Open Live Mode
          </Button>
          <Button render={<Link href="/faq" />} variant="outline" shape="pill" size="lg">
            Read the FAQ
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
