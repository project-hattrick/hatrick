'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/services/queries/use-auth';
import { LoginDialog } from './login-dialog';

const PROFILE_PIC = 'https://i.pravatar.cc/80?img=12';

/**
 * Navbar profile avatar — opens the "Sign in with Solana" dialog. The status dot
 * reflects the sign-in lifecycle: idle → connecting/signing → authenticated. A
 * signed-in user gets a neon ring; a busy state pulses.
 */
export function WalletAvatar() {
  const [open, setOpen] = useState(false);
  const { isConnected, isConnecting, isAuthenticated, isAuthenticating } = useAuth();
  const busy = isConnecting || isAuthenticating;

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
