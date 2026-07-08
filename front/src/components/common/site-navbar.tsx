'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Plus, MagnifyingGlass } from '@/components/common/icons';
import { navLinks } from '@/config/nav.config';
import { IconButton } from './icon-button';
import { LanguageSwitcher } from './language-switcher';
import { MobileNavMenu } from './mobile-nav-menu';
import { formatThousands } from '@/lib/format';
import { useLocalizedPath } from '@/hooks/use-localized-path';
import { useT } from '@/i18n/i18n-provider';
import { useUiStore } from '@/store/ui.store';
import { useBalance, useWalletStore } from '@/store/wallet.store';
import { cn } from '@/lib/utils';

/** Coins granted by the navbar "+" top-up (mock play-money). */
const TOP_UP_AMOUNT = 1_000_000;

const WalletAvatar = dynamic(() => import('./wallet-avatar').then((m) => m.WalletAvatar), { ssr: false });
const NotificationsMenu = dynamic(() => import('./notifications-menu').then((m) => m.NotificationsMenu), { ssr: false });

/**
 * Top bar. Transparent at the very top of the page and gains its background as soon as the page is
 * scrolled — the same behaviour everywhere, over a hero or a plain page. The `heroBackdrop` prop is
 * kept for call-site clarity but no longer changes behaviour.
 */
export function SiteNavbar(_props: { heroBackdrop?: boolean } = {}) {
  const t = useT();
  const localizedPath = useLocalizedPath();
  const openSearch = useUiStore((s) => s.setSearchOpen);
  const coins = useBalance();
  const credit = useWalletStore((s) => s.credit);

  const topUp = () => {
    credit(TOP_UP_AMOUNT);
    toast.success(`+${formatThousands(TOP_UP_AMOUNT)} coins added.`);
  };

  // Transparent at the very top; the background comes in as soon as you scroll (hysteresis avoids
  // flicker). Start transparent to match the first paint before the scroll position is read.
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      setSolid(window.scrollY > 8);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    read();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav
      className={cn(
        'pointer-events-auto fixed inset-x-0 top-0 z-30 h-16 border-b pt-[env(safe-area-inset-top)] transition-colors duration-300',
        solid ? 'border-border bg-surface-1' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-full w-full items-center justify-between px-3 sm:px-4 md:px-6">
        <MobileNavMenu />
        <div className="hidden flex-1 items-center gap-6 text-sm font-semibold md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={localizedPath(link.href)}
              className="flex items-center gap-2 text-foreground/90 transition hover:text-foreground"
            >
              <link.icon className="size-4" />
              {t(link.labelKey)}
            </Link>
          ))}
        </div>

        <Link href={localizedPath('/')} aria-label={t('common.home')} className="shrink-0">
          <Image src="/logo.png" alt="Hat-trick" width={472} height={481} priority className="h-8 w-auto md:h-10" />
        </Link>

        <div className="flex items-center justify-end gap-2 sm:gap-3 md:flex-1 md:gap-5">
          <IconButton label={t('common.searchPlayers')} onClick={() => openSearch(true)}>
            <MagnifyingGlass className="size-5" />
          </IconButton>
          <LanguageSwitcher />
          <span className="hidden sm:inline-flex">
            <NotificationsMenu />
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Image src="/coin.png" alt="Coins" width={22} height={22} className="size-4 sm:size-5" />
            <span suppressHydrationWarning className="text-xs font-bold text-foreground tabular-nums sm:text-sm">
              {formatThousands(coins)}
            </span>
            <button
              type="button"
              aria-label={t('common.addCoins')}
              onClick={topUp}
              className="flex size-5 items-center justify-center rounded-full bg-neon text-primary-foreground transition hover:bg-neon-hover sm:size-6"
            >
              <Plus className="size-3" />
            </button>
          </div>
          <WalletAvatar />
        </div>
      </div>
    </nav>
  );
}
