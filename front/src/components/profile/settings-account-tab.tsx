'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Check, Coins, Copy, Pencil, SignOut, Wallet } from '@/components/common/icons';
import { UserAvatar } from '@/components/common/user-avatar';
import { TierBadge } from '@/components/duelists/tier-badge';
import { formatThousands, shortAddress } from '@/lib/format';
import { useSelfProfile } from '@/hooks/use-self-identity';
import { useProfileStore } from '@/store/profile.store';
import type { AuthUser } from '@/services/auth.service';

interface SettingsAccountTabProps {
  user: AuthUser;
  /** Signs out and closes the dialog (wired by the dialog shell). */
  onSignOut: () => void;
}

/** Account tab of the Settings dialog — who you are, your session, and account actions. */
export function SettingsAccountTab({ user, onSignOut }: SettingsAccountTabProps) {
  const draft = useProfileStore();
  const self = useSelfProfile();
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-1/60 p-3">
        <UserAvatar src={self.portraitSrc} alt={name} size={56} className="rounded-xl ring-1 ring-border" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-semibold">{name}</span>
          <span className="truncate text-xs text-muted-foreground">{handle}</span>
          <span className="mt-0.5 self-start">
            <TierBadge tier={self.tier} division={self.division} />
          </span>
        </div>
        <Button size="sm" variant="outline" render={<Link href="/profile?edit=1" />}>
          <Pencil className="size-4" /> Edit profile
        </Button>
      </div>

      <div className="flex flex-col divide-y divide-border/40 rounded-xl border border-border/60 bg-surface-1/60">
        <button
          type="button"
          onClick={copyWallet}
          aria-label="Copy wallet address"
          className="flex items-center gap-2.5 px-3 py-2.5 text-left text-sm text-muted-foreground transition hover:text-foreground"
        >
          <Wallet className="size-4 shrink-0" />
          <span className="flex-1 truncate font-mono">{shortAddress(user.walletAddress)}</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-micro uppercase tracking-wide">devnet</span>
          {copied ? <Check className="size-4 text-neon" /> : <Copy className="size-4" />}
        </button>
        <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-muted-foreground">
          <Coins className="size-4 shrink-0" />
          <span className="flex-1">Balance</span>
          <span className="font-mono font-bold tabular-nums text-foreground">
            {formatThousands(Number(user.balance))}
          </span>
        </div>
      </div>

      <Button variant="ghost" className="self-start text-live hover:text-live" onClick={onSignOut}>
        <SignOut className="size-4" /> Sign out
      </Button>
    </div>
  );
}
