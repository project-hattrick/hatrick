'use client';

import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { cn } from '@/lib/utils';

const PROFILE_PIC = 'https://i.pravatar.cc/80?img=12';

/** Profile picture that opens the wallet modal — the account / login entry point. */
export function WalletAvatar() {
  const { setVisible } = useWalletModal();
  const { connected } = useWallet();

  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      aria-label={connected ? 'Account' : 'Connect wallet'}
      className="relative shrink-0"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PROFILE_PIC} alt="Profile" className="size-9 rounded-full border border-border/60 object-cover" />
      <span
        className={cn(
          'absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background',
          connected ? 'bg-neon' : 'bg-muted-foreground',
        )}
      />
    </button>
  );
}
