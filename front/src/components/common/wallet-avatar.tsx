'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

import { UserCircle, CircleNotch } from '@/components/common/icons';
import { useAuth } from '@/services/queries/use-auth';
import { useSelfIdentity } from '@/hooks/use-self-identity';
import { signOutLocal } from '@/services/session-mode';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useUiStore } from '@/store/ui.store';
import { UserAvatar } from './user-avatar';
import { AccountMenu } from './account-menu';

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
  const { portraitSrc } = useSelfIdentity();
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

  // Signed-in avatar button — the AccountMenu wraps it as its dropdown trigger (or it opens the
  // onboarding dialog directly for a freshly-registered account).
  const avatar = (
    <button
      type="button"
      aria-label="Account"
      title="Account"
      className="relative shrink-0"
      onClick={onboarding ? openLogin : undefined}
    >
      <UserAvatar src={portraitSrc} alt="Profile" size={36} className="rounded-full border border-neon transition" />
      <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-background bg-neon" />
    </button>
  );

  if (isAuthenticated && user && !onboarding) {
    return <AccountMenu user={user} trigger={avatar} onSignOut={signOut} />;
  }
  if (isAuthenticated) {
    return avatar; // mid-onboarding
  }

  // Signed out → a clear, centred "Sign in" button (an empty avatar placeholder read as broken/unintuitive).
  return (
    <button
      type="button"
      onClick={openLogin}
      disabled={busy}
      aria-label={busy ? 'Signing in' : 'Sign in'}
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-neon px-2.5 text-sm font-semibold text-primary-foreground shadow-e1 transition hover:bg-neon-hover disabled:opacity-70 sm:px-3.5"
    >
      {busy ? <CircleNotch className="size-4 animate-spin" /> : <UserCircle className="size-4" weight="fill" />}
      <span className="hidden sm:inline">{busy ? 'Signing in…' : 'Sign in'}</span>
    </button>
  );
}
