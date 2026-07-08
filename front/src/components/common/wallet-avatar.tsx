'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/services/queries/use-auth';
import { signOutLocal } from '@/services/session-mode';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useUiStore } from '@/store/ui.store';
import { AccountMenu } from './account-menu';

const PROFILE_PIC = 'https://i.pravatar.cc/80?img=12';

/**
 * Navbar profile avatar. Signed out → opens the "Sign in with Solana" dialog. Signed in →
 * opens a lightweight account dropdown (not a modal). The login dialog is still used to HOST
 * the first-login onboarding, which auto-opens for a freshly registered account.
 */
export function WalletAvatar() {
  const [autoOpened, setAutoOpened] = useState(false);
  const { isConnected, isConnecting, isAuthenticated, isAuthenticating, user } = useAuth();
  const { disconnect } = useWallet();
  const openLogin = useUiStore((s) => s.openLogin);
  const setLoginOpen = useUiStore((s) => s.setLoginOpen);
  const pending = useOnboardingStore((s) => s.pending);
  const forcedOpen = useOnboardingStore((s) => s.forcedOpen);
  const busy = isConnecting || isAuthenticating;

  // Guest sessions have no wallet to disconnect, so tear the local session down directly;
  // a real wallet disconnect lets the auth driver run the full (backend) teardown.
  const signOut = () => {
    if (isConnected) void disconnect();
    else signOutLocal();
  };

  const wallet = user?.walletAddress ?? null;
  const onboarding = isAuthenticated && Boolean(wallet) && pending.includes(wallet as string);

  // New account: auto-open the login dialog so it can host onboarding — whether they just signed
  // in here or auto-connected on reload mid-flow. Adjusted during render (a latch, not an effect)
  // so it fires once. Suppressed while the dev trigger forces its own copy open.
  const shouldAutoOpen = onboarding && !forcedOpen;
  if (shouldAutoOpen && !autoOpened) {
    setAutoOpened(true);
    setLoginOpen(true);
  } else if (!shouldAutoOpen && autoOpened) {
    setAutoOpened(false);
  }

  const label = isAuthenticated
    ? 'Account'
    : busy
      ? 'Signing in…'
      : isConnected
        ? 'Sign in'
        : 'Connect wallet';

  const avatar = (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="relative shrink-0"
      // When signed out the button opens the login dialog; when signed in the AccountMenu wraps
      // it as its dropdown trigger and owns the click.
      onClick={isAuthenticated && !onboarding ? undefined : openLogin}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PROFILE_PIC}
        alt="Profile"
        className={cn(
          'size-9 rounded-full border object-cover transition',
          isAuthenticated ? 'border-neon' : 'border-border/60',
        )}
      />
      <span
        className={cn(
          'absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background transition',
          isAuthenticated ? 'bg-neon' : busy ? 'animate-pulse bg-warning' : 'bg-muted-foreground',
        )}
      />
    </button>
  );

  return (
    <>
      {isAuthenticated && user && !onboarding ? (
        <AccountMenu user={user} trigger={avatar} onSignOut={signOut} />
      ) : (
        avatar
      )}
    </>
  );
}
