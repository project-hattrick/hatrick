'use client';

import { useState, type ReactElement } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, Copy, SignOut, UserCircle, Wallet } from '@/components/common/icons';
import { TierBadge } from '@/components/duelists/tier-badge';
import { formatThousands, shortAddress } from '@/lib/format';
import { selfProfile } from '@/config/duelists.config';
import { winRate } from '@/config/profile-mock';
import { useProfileStore } from '@/store/profile.store';
import type { AuthUser } from '@/services/auth.service';

interface AccountMenuProps {
  user: AuthUser;
  onSignOut: () => void;
  /** The navbar avatar button — used as the dropdown anchor. */
  trigger: ReactElement;
}

/**
 * Signed-in account dropdown anchored to the navbar avatar: mini profile card + quick
 * stats + profile link + sign out. Replaces the old "Your account" modal so a plain click
 * opens a lightweight menu instead of a full dialog.
 */
export function AccountMenu({ user, onSignOut, trigger }: AccountMenuProps) {
  const draft = useProfileStore();
  const [copied, setCopied] = useState(false);

  const name = draft.displayName || user.displayName || shortAddress(user.walletAddress);
  const handle = draft.username
    ? `@${draft.username.replace(/^@/, '')}`
    : `@${shortAddress(user.walletAddress)}`;

  const copyWallet = () => {
    void navigator.clipboard?.writeText(user.walletAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const stats = [
    { label: 'Coins', value: formatThousands(Number(user.balance)) },
    { label: 'MMR', value: String(selfProfile.rating) },
    { label: 'Win rate', value: `${winRate(selfProfile)}%` },
    { label: 'Streak', value: selfProfile.streak },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent className="min-w-72">
        {/* Mini profile card */}
        <div className="flex items-center gap-3 px-1 pt-1 pb-2">
          <span className="grid size-14 shrink-0 place-items-end overflow-hidden rounded-xl bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-white/10">
            <Image
              src={selfProfile.portraitSrc}
              alt={name}
              width={56}
              height={56}
              className="translate-y-[6%] scale-110 object-contain object-bottom"
              style={{ imageRendering: 'pixelated' }}
            />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-semibold">{name}</span>
            <span className="truncate text-xs text-muted-foreground">{handle}</span>
            <span className="mt-0.5 self-start">
              <TierBadge tier={selfProfile.tier} division={selfProfile.division} />
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={copyWallet}
          className="flex w-full items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-2 text-xs text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground"
          aria-label="Copy wallet address"
        >
          <Wallet className="size-3.5" />
          <span className="font-mono">{shortAddress(user.walletAddress)}</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
            devnet
          </span>
          {copied ? (
            <Check className="ml-auto size-3.5 text-neon" />
          ) : (
            <Copy className="ml-auto size-3.5" />
          )}
        </button>

        <div className="mt-2 grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-lg bg-white/[0.04] px-1 py-2"
            >
              <span className="font-mono text-sm font-bold tabular-nums">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserCircle className="size-4" /> My profile
        </DropdownMenuItem>
        <DropdownMenuItem className="text-live data-highlighted:text-live" onClick={onSignOut}>
          <SignOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
