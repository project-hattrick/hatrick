'use client';

import { Button } from '@/components/ui/button';
import { ShieldCheck, CircleNotch, Check, Warning } from '@/components/common/icons';
import { useAuth } from '@/services/queries/use-auth';
import { useSignInMutation } from '@/services/queries/use-sign-in';
import { cn } from '@/lib/utils';

/** Failed fetches read as "NetworkError…"/"Failed to fetch" — translate to plain language. */
const isNetworkError = (m: string | null): boolean =>
  !!m && /fetch|network|load failed/i.test(m);

/**
 * Sign-in step: prompts the user to authenticate via Privy (wallet or email
 * embedded). The app-wide driver auto-fires the token exchange on Privy
 * authentication, so this screen is guidance-first — it tells the user what
 * is happening and surfaces any failure with a retry.
 */
export function SignStep() {
  const { isAuthenticated, isAuthenticating, error } = useAuth();
  const { signIn } = useSignInMutation();

  const busy = isAuthenticating;
  const errored = !busy && !!error;

  const status = busy
    ? {
        icon: <CircleNotch className="size-6 animate-spin text-neon" />,
        ring: 'border-neon/30 bg-neon/5',
        title: 'Connecting…',
        detail: 'Completing sign-in with Privy. This only takes a moment.',
      }
    : errored
      ? {
          icon: <Warning className="size-6 text-destructive" />,
          ring: 'border-destructive/40 bg-destructive/10',
          title: isNetworkError(error) ? "Can't reach the server" : 'Sign-in failed',
          detail: isNetworkError(error)
            ? 'The API server did not respond. Make sure it is running, then try again.'
            : (error as string),
        }
      : isAuthenticated
        ? {
            icon: <Check className="size-6 text-neon" weight="bold" />,
            ring: 'border-neon/30 bg-neon/5',
            title: 'Signed in',
            detail: 'You are authenticated.',
          }
        : {
            icon: <ShieldCheck className="size-6 text-neon" />,
            ring: 'border-neon/30 bg-neon/5',
            title: 'Sign in with Privy',
            detail: 'Connect your wallet or use email to sign in securely.',
          };

  return (
    <div className="space-y-5">
      {/* State-driven status — the primary instruction */}
      <div className="flex flex-col items-center gap-3 py-1 text-center">
        <div className={cn('grid size-14 place-items-center rounded-full border', status.ring)}>{status.icon}</div>
        <div className="space-y-1">
          <p className="font-heading text-base font-medium">{status.title}</p>
          <p className="mx-auto max-w-[17rem] text-sm leading-relaxed text-muted-foreground">{status.detail}</p>
        </div>
      </div>

      {/* Reassurance */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-neon" /> Secure sign-in</span>
        <span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-neon" weight="bold" /> Free · no gas</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button shape="pill" className="w-full" onClick={signIn} disabled={busy}>
          {busy ? (
            <>
              <CircleNotch className="size-4 animate-spin" /> Signing in…
            </>
          ) : errored ? (
            'Try again'
          ) : (
            <>
              <ShieldCheck className="size-4" /> Sign in
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
