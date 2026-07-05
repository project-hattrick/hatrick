'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Gift, Image as ImageIcon, Bell, Plus, MagnifyingGlass } from '@/components/common/icons';
import { navLinks } from '@/config/nav.config';
import { IconButton } from './icon-button';
import { formatThousands } from '@/lib/format';
import { useAuth } from '@/services/queries/use-auth';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

const COIN_BALANCE = 28_105_820;

const WalletAvatar = dynamic(() => import('./wallet-avatar').then((m) => m.WalletAvatar), { ssr: false });

/**
 * Top bar. Solid by default; with `heroBackdrop` it starts transparent at the very top (over the
 * hero) and gains its background as soon as the page is scrolled.
 */
export function SiteNavbar({ heroBackdrop = false }: { heroBackdrop?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const openSearch = useUiStore((s) => s.setSearchOpen);
  // Show the real devnet play-money balance from the DB once signed in.
  const coins = isAuthenticated && user ? Number(user.balance) : COIN_BALANCE;

  // Over a hero, go solid only after roughly one viewport of scroll (hysteresis avoids flicker).
  const [solid, setSolid] = useState(!heroBackdrop);
  useEffect(() => {
    if (!heroBackdrop) {
      setSolid(true);
      return;
    }
    let raf = 0;
    const read = () => {
      raf = 0;
      // Transparent only at the very top; the background comes in as soon as you scroll.
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
  }, [heroBackdrop]);

  return (
    <nav
      className={cn(
        'pointer-events-auto fixed inset-x-0 top-0 z-30 h-16 border-b pt-[env(safe-area-inset-top)] transition-colors duration-300',
        solid ? 'border-border bg-surface-1' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex h-full w-full items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="hidden flex-1 items-center gap-6 text-sm font-semibold md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-foreground/90 transition hover:text-foreground"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
          <span className="hidden items-center gap-2 lg:flex">
            <Gift className="size-4 text-warning" />
            <span className="text-warning">5 Months</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-neon">Free Access</span>
          </span>
        </div>

        <Link href="/" aria-label="Hat-trick home" className="shrink-0">
          <Image src="/logo.png" alt="Hat-trick" width={472} height={481} priority className="h-8 w-auto md:h-10" />
        </Link>

        <div className="flex items-center justify-end gap-2 sm:gap-3 md:flex-1 md:gap-5">
          <IconButton label="Search players" onClick={() => openSearch(true)}>
            <MagnifyingGlass className="size-5" />
          </IconButton>
          <IconButton label="Gallery" className="hidden sm:inline-flex">
            <ImageIcon className="size-5" />
          </IconButton>
          <span className="relative hidden sm:inline-flex">
            <IconButton label="Notifications">
              <Bell className="size-5" />
            </IconButton>
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full border-2 border-background bg-live" />
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Image src="/coin.png" alt="Coins" width={22} height={22} className="size-4 sm:size-5" />
            <span className="text-xs font-bold text-foreground sm:text-sm">{formatThousands(coins)}</span>
            <button
              type="button"
              aria-label="Add coins"
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
