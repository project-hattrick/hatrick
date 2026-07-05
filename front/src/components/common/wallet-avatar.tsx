'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/services/queries/use-auth';
import { useOnboardingStore } from '@/store/onboarding.store';
import { LoginDialog } from './login-dialog';

const PROFILE_PIC = 'https://i.pravatar.cc/80?img=12';

/**
 * Navbar profile avatar — opens the "Sign in with Solana" dialog. The status dot
 * reflects the sign-in lifecycle: idle → connecting/signing → authenticated. A
 * signed-in user gets a neon ring; a busy state pulses.
 */
export function WalletAvatar() {
  const [open, setOpen] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);
  const { isConnected, isConnecting, isAuthenticated, isAuthenticating } = useAuth();
  const hasOnboarded = useOnboardingStore((s) => s.hasOnboarded);
  const forcedOpen = useOnboardingStore((s) => s.forcedOpen);
  const busy = isConnecting || isAuthenticating;

  // Post-login: first-timers get the onboarding automatically (the login dialog hosts it).
  // Fires whether they signed in via this dialog or via auto-connect on reload. Adjusted during
  // render (a latch, not an effect) so it triggers exactly once per first-login. Suppressed while
  // the dev trigger is forcing its own copy open, so they never stack.
  const shouldAutoOpen = isAuthenticated && !hasOnboarded && !forcedOpen;
  if (shouldAutoOpen && !autoOpened) {
    setAutoOpened(true);
    setOpen(true);
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
        className="relative shrink-0"
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
            isAuthenticated
              ? 'bg-neon'
              : busy
                ? 'animate-pulse bg-warning'
                : 'bg-muted-foreground',
          )}
        />
      </button>
      <LoginDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
