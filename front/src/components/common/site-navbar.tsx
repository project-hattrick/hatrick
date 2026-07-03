'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Gift, Image as ImageIcon, Bell, Plus } from '@/components/common/icons';
import { navLinks } from '@/config/nav.config';
import { IconButton } from './icon-button';
import { formatThousands } from '@/lib/format';
import { useAuth } from '@/services/queries/use-auth';

const COIN_BALANCE = 28_105_820;

const WalletAvatar = dynamic(() => import('./wallet-avatar').then((m) => m.WalletAvatar), { ssr: false });

/** Transparent top bar, centered on the same max width as the floating widgets. */
export function SiteNavbar() {
  const { isAuthenticated, user } = useAuth();
  // Show the real devnet play-money balance from the DB once signed in.
  const coins = isAuthenticated && user ? Number(user.balance) : COIN_BALANCE;

  return (
    <nav className="pointer-events-auto fixed inset-x-0 top-0 z-30 h-16 pt-[env(safe-area-inset-top)]">
      <div className="navbar-shrink mx-auto flex h-full w-full items-center justify-between border border-transparent px-3 sm:px-4 md:px-6">
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
            <Gift className="size-4 text-amber-400" />
            <span className="text-amber-400">5 Months</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-neon">Free Access</span>
          </span>
        </div>

        <Link href="/" aria-label="Hat-trick home" className="shrink-0">
          <Image src="/logo.png" alt="Hat-trick" width={472} height={481} priority className="h-8 w-auto md:h-10" />
        </Link>

        <div className="flex items-center justify-end gap-2 sm:gap-3 md:flex-1 md:gap-5">
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
