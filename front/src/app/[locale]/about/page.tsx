import Link from 'next/link';
import type { Metadata } from 'next';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { buildMetadata } from '@/lib/seo';
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
import { getDictionary } from '@/i18n/get-dictionary';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales';
import { localizePath } from '@/i18n/path';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

interface ModeCard {
  icon: Icon;
  href: string;
  accent: string;
}

const modes: ModeCard[] = [
  { icon: Broadcast, href: '/live', accent: 'text-live' },
  { icon: GameController, href: '/fantasy', accent: 'text-neon' },
];

const values: { icon: Icon }[] = [
  { icon: Lightning },
  { icon: Trophy },
  { icon: Globe },
  { icon: ShieldCheck },
  { icon: TrendUp },
  { icon: Users },
];

function resolveLocale(locale: string): Locale {
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dictionary = getDictionary(locale);

  return buildMetadata({
    title: dictionary.about.metadata.title,
    description: dictionary.about.metadata.description,
    path: '/about',
    locale,
  });
}

export default async function AboutPage({ params }: LocalePageProps) {
  const locale = resolveLocale((await params).locale);
  const dictionary = getDictionary(locale);
  const copy = dictionary.about;

  return (
    <PageShell>
      <section className="py-8 md:py-14">
        <div className="hero-ambient absolute inset-0 pointer-events-none" aria-hidden />
        <div className="relative flex flex-col gap-5">
          <span className="text-eyebrow text-neon">{copy.hero.eyebrow}</span>
          <h1 className="text-display max-w-2xl text-foreground">{copy.hero.title}</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {dictionary.home.site.description}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button render={<Link href={localizePath('/live', locale)} />} shape="pill" size="lg">
              {dictionary.common.actions.watchLive}
            </Button>
            <Button
              render={<Link href={localizePath('/fantasy', locale)} />}
              variant="outline"
              shape="pill"
              size="lg"
            >
              {dictionary.common.actions.buildSquad}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <h2 className="text-title mb-6 text-foreground">{copy.sections.chooseMode}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {modes.map((mode, index) => {
            const modeCopy = copy.modes[index];
            const ModeIcon = mode.icon;
            return (
              <GlassPanel key={modeCopy.label} tone="surface" className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3">
                  <ModeIcon className={`size-6 ${mode.accent}`} />
                  <span className={`text-eyebrow ${mode.accent}`}>{modeCopy.label}</span>
                </div>
                <h3 className="text-title text-foreground">{modeCopy.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{modeCopy.body}</p>
                <Link
                  href={localizePath(mode.href, locale)}
                  className={`mt-auto text-sm font-semibold underline-offset-4 hover:underline ${mode.accent}`}
                >
                  {modeCopy.cta} →
                </Link>
              </GlassPanel>
            );
          })}
        </div>
      </section>

      <section className="py-8">
        <GlassPanel tone="dark" className="flex flex-col gap-4 p-6 md:p-8">
          <span className="text-eyebrow text-muted-foreground">{copy.sections.poweredBy}</span>
          <h2 className="text-title text-foreground">{copy.sections.txlineTitle}</h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{copy.txline}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {copy.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border/50 bg-surface-2/60 px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </GlassPanel>
      </section>

      <section className="py-8">
        <h2 className="text-title mb-6 text-foreground">{copy.sections.values}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => {
            const valueCopy = copy.values[index];
            const ValueIcon = value.icon;
            return (
              <GlassPanel key={valueCopy.title} tone="blur" className="flex flex-col gap-3 p-5">
                <ValueIcon className="size-5 text-neon" />
                <h3 className="text-sm font-bold text-foreground">{valueCopy.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{valueCopy.body}</p>
              </GlassPanel>
            );
          })}
        </div>
      </section>

      <section className="py-8 text-center">
        <h2 className="text-title mb-3 text-foreground">{copy.sections.ready}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{copy.sections.readyBody}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button render={<Link href={localizePath('/live', locale)} />} shape="pill" size="lg">
            {dictionary.common.actions.openLive}
          </Button>
          <Button
            render={<Link href={localizePath('/faq', locale)} />}
            variant="outline"
            shape="pill"
            size="lg"
          >
            {dictionary.common.actions.readFaq}
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
