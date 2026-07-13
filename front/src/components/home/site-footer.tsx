'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AppleLogo, Globe, Envelope, ChatCircle, Play, PaperPlaneTilt, type Icon } from '@/components/common/icons';
import { PoweredByTxline } from '@/components/common/powered-by-txline';
import { useI18n } from '@/i18n/i18n-provider';
import { localizePath } from '@/i18n/path';

const socials: { labelKey: 'website' | 'community' | 'telegram' | 'email'; icon: Icon; href: string }[] = [
  { labelKey: 'website', icon: Globe, href: '/' },
  { labelKey: 'community', icon: ChatCircle, href: '/faq' },
  { labelKey: 'telegram', icon: PaperPlaneTilt, href: '/contact' },
  { labelKey: 'email', icon: Envelope, href: '/contact' },
];

const storeIcons: Record<string, Icon> = {
  'App Store': AppleLogo,
  'Google Play': Play,
};

/** Landing footer: brand, link columns, app badges and the devnet disclaimer. */
export function SiteFooter() {
  const { dictionary, locale } = useI18n();
  const copy = dictionary.home.footer;
  const appBadges = [copy.badges.appStore, copy.badges.googlePlay];

  return (
    <footer className="relative z-10 border-t border-border bg-background px-6 py-10 md:py-14">
      <div className="mx-auto grid w-full max-w-7xl gap-8 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-10">
        <div className="flex flex-col gap-4">
          <Link href={localizePath('/', locale)} className="flex items-center gap-2">
            <Image src="/logo.png" alt="Hatrick" width={472} height={481} className="h-8 w-auto" />
            <span className="text-lg font-bold text-foreground">Hatrick</span>
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">{copy.tagline}</p>
          <div className="flex items-center gap-2">
            {socials.map((social) => {
              const Icon = social.icon;
              const label = copy.socials[social.labelKey];
              return (
                <Link
                  key={social.labelKey}
                  href={localizePath(social.href, locale)}
                  aria-label={label}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-surface-2 text-muted-foreground transition hover:border-neon/40 hover:text-neon"
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
          </div>
          <PoweredByTxline className="mt-1" />
        </div>

        {copy.columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <span className="text-eyebrow text-muted-foreground">{column.title}</span>
            {column.links.map((link) => (
              <Link
                key={link.href}
                href={localizePath(link.href, locale)}
                className="text-sm text-foreground/80 transition hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="flex flex-col gap-3">
          <span className="text-eyebrow text-muted-foreground">{copy.getApp}</span>
          {appBadges.map((badge) => {
            const Icon = storeIcons[badge.store] ?? Globe;
            return (
              <Link
                key={badge.store}
                href="#"
                className="inline-flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5 transition hover:border-neon/40"
              >
                <Icon className="size-6" />
                <span className="flex flex-col leading-tight">
                  <span className="text-micro text-muted-foreground">{badge.tagline}</span>
                  <span className="text-sm font-semibold">{badge.store}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-10 flex w-full max-w-7xl flex-col gap-2 border-t border-border/40 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>{copy.copyright}</span>
        <span>{copy.disclaimer}</span>
      </div>
    </footer>
  );
}
