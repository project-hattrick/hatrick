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
import { useChainBalance } from '@/services/queries/use-chain-balance';
import { isChainSession } from '@/services/session-mode';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

/**
 * Wager currency shown in the navbar. Front-only label for now (no on-chain wiring yet) — the app
 * settles bets in a stablecoin, so the balance reads as a token ticker rather than generic "coins".
 * Single source so it's a one-line switch (USDT ↔ USDC) when the SPL token lands.
 */
const CURRENCY_SYMBOL = 'USDT';

/** Balance granted by the navbar "+" top-up (mock, front-only faucet). */
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
  const playMoneyCoins = useBalance();
  const credit = useWalletStore((s) => s.credit);
  const { data: chainBalance } = useChainBalance();
  // When chain is enabled and the user has an authed session, show on-chain play-token balance.
  const chainMode = env.chainEnabled && isChainSession();
  const coins = chainMode && chainBalance ? Number(chainBalance.playToken) : playMoneyCoins;

  const topUp = () => {
    credit(TOP_UP_AMOUNT);
    toast.success(`+${formatThousands(TOP_UP_AMOUNT)} ${CURRENCY_SYMBOL} added.`);
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
      <div className="relative mx-auto flex h-full w-full items-center justify-between px-3 sm:px-4 md:px-6">
        <MobileNavMenu />
        <div className="hidden min-w-0 flex-1 items-center gap-3 text-sm font-semibold lg:flex xl:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={localizedPath(link.href)}
              className="flex shrink-0 items-center gap-2 text-foreground/90 transition hover:text-foreground"
            >
              <link.icon className="size-4" />
              {t(link.labelKey)}
            </Link>
          ))}
        </div>

        {/* Below lg the sides are uneven (hamburger vs sign-in/avatar), so the logo is pinned to the
            true centre; lg+ keeps it in flow between the equal flex-1 sides. */}
        <Link
          href={localizedPath('/')}
          aria-label={t('common.home')}
          className="absolute left-1/2 top-1/2 shrink-0 -translate-x-1/2 -translate-y-1/2 lg:static lg:translate-x-0 lg:translate-y-0"
        >
          <Image src="/logo.png" alt="Hatrick" width={472} height={481} priority className="h-8 w-auto md:h-10" />
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 lg:flex-1 lg:gap-2 xl:gap-5">
          {/* Below lg the bar is just hamburger | logo | avatar — everything else lives in the menu. */}
          <span className="hidden lg:inline-flex">
            <IconButton label={t('common.searchPlayers')} onClick={() => openSearch(true)}>
              <MagnifyingGlass className="size-5" />
            </IconButton>
          </span>
          <span className="hidden lg:inline-flex">
            <LanguageSwitcher />
          </span>
          <span className="hidden lg:inline-flex">
            <NotificationsMenu />
          </span>
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Image src="/coin.png" alt={CURRENCY_SYMBOL} width={22} height={22} className="size-5" />
            <span suppressHydrationWarning className="text-sm font-bold text-foreground tabular-nums">
              {formatThousands(coins)}
            </span>
            <span className="hidden text-xs font-semibold text-foreground/55 xl:inline">{CURRENCY_SYMBOL}</span>
            <button
              type="button"
              aria-label={`Add ${CURRENCY_SYMBOL}`}
              onClick={topUp}
              className="flex size-6 items-center justify-center rounded-full bg-neon text-primary-foreground transition hover:bg-neon-hover"
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
