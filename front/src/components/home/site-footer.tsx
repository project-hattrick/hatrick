import Link from 'next/link';
import Image from 'next/image';
import { AppleLogo, Globe, Envelope, ChatCircle, Play, PaperPlaneTilt, type Icon } from '@/components/common/icons';
import { PoweredByTxline } from '@/components/common/powered-by-txline';
import { appBadges, footerColumns } from '@/config/home.config';

const socials: { label: string; icon: Icon; href: string }[] = [
  { label: 'Website', icon: Globe, href: '/' },
  { label: 'Community', icon: ChatCircle, href: '/faq' },
  { label: 'Telegram', icon: PaperPlaneTilt, href: '/contact' },
  { label: 'Email', icon: Envelope, href: '/contact' },
];

const storeIcons: Record<string, Icon> = {
  'App Store': AppleLogo,
  'Google Play': Play,
};

/** Landing footer: brand, link columns, app badges and the devnet disclaimer. */
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-background px-6 py-10 md:py-14">
      <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-10">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Hat-trick" width={472} height={481} className="h-8 w-auto" />
            <span className="text-lg font-bold text-foreground">Hat-trick</span>
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            The platform that puts you at the heart of the game — live, fantasy and predictions in one place.
          </p>
          <div className="flex items-center gap-2">
            {socials.map((social) => {
              const Icon = social.icon;
              return (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-surface-2 text-muted-foreground transition hover:border-neon/40 hover:text-neon"
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
          </div>
          <PoweredByTxline className="mt-1" />
        </div>

        {footerColumns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <span className="text-eyebrow text-muted-foreground">{column.title}</span>
            {column.links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-foreground/80 transition hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="flex flex-col gap-3">
          <span className="text-eyebrow text-muted-foreground">Get the app</span>
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

      <div className="mx-auto mt-10 flex w-full max-w-6xl flex-col gap-2 border-t border-border/40 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>© 2026 Hat-trick. All rights reserved.</span>
        <span>Devnet demo · play-money only · not affiliated with FIFA.</span>
      </div>
    </footer>
  );
}
