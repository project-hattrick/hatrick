'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Gift, Image as ImageIcon, Bell, Plus } from 'lucide-react';
import { navLinks } from '@/config/nav.config';
import { IconButton } from './icon-button';
import { formatThousands } from '@/lib/format';

const COIN_BALANCE = 28_105_820;

const WalletAvatar = dynamic(() => import('./wallet-avatar').then((m) => m.WalletAvatar), { ssr: false });

/** Transparent top bar, centered on the same max width as the floating widgets. */
export function SiteNavbar() {
  return (
    <nav className="pointer-events-auto fixed inset-x-0 top-0 z-30 h-16">
      <div className="mx-auto flex h-full w-full items-center justify-between px-6 md:w-[92%]">
        <div className="flex flex-1 items-center gap-6 text-sm font-semibold">
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
          <Image src="/logo.png" alt="Hat-trick" width={472} height={481} priority className="h-10 w-auto" />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-5">
          <IconButton label="Gallery" className="hidden sm:inline-flex">
            <ImageIcon className="size-5" />
          </IconButton>
          <span className="relative">
            <IconButton label="Notifications">
              <Bell className="size-5" />
            </IconButton>
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full border-2 border-background bg-live" />
          </span>
          <div className="flex items-center gap-2">
            <Image src="/coin.png" alt="Coins" width={22} height={22} className="size-5" />
            <span className="text-sm font-bold text-foreground">{formatThousands(COIN_BALANCE)}</span>
            <button
              type="button"
              aria-label="Add coins"
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
