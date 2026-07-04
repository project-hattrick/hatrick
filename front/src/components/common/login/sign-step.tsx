'use client';

import { useWallet } from '@solana/wallet-adapter-react';

import { Button } from '@/components/ui/button';
import { ShieldCheck, CircleNotch, Check, Warning } from '@/components/common/icons';
import { shortAddress } from '@/lib/format';
import { useAuth } from '@/services/queries/use-auth';
import { useSignInMutation } from '@/services/queries/use-sign-in';
import { cn } from '@/lib/utils';

/** Failed fetches read as "NetworkError…"/"Failed to fetch" — translate to plain language. */
const isNetworkError = (m: string | null): boolean =>
  !!m && /fetch|network|load failed/i.test(m);

/**
 * Step 2 of login: the connected wallet signs a nonce to prove ownership. The
 * app-wide driver auto-fires this on connect, so this screen is guidance-first —
 * it tells the user to approve the pop-up and surfaces any failure with a retry.
 */
export function SignStep() {
  const { publicKey, wallet, disconnect } = useWallet();
  const { isAuthenticating, error } = useAuth();
  const signIn = useSignInMutation();

  const short = shortAddress(publicKey?.toBase58() ?? '');
  const busy = isAuthenticating || signIn.isPending;
  const errored = !busy && !!error;

  const status = busy
    ? {
        icon: <CircleNotch className="size-6 animate-spin text-neon" />,
        ring: 'border-neon/30 bg-neon/5',
        title: 'Check your wallet',
        detail: 'Approve the signature request in your wallet pop-up to continue.',
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
      : {
          icon: <ShieldCheck className="size-6 text-neon" />,
          ring: 'border-neon/30 bg-neon/5',
          title: 'Approve to sign in',
          detail: 'Your wallet will ask you to approve a one-time signature. It proves the wallet is yours.',
        };

  return (
    <div className="space-y-5">
      {/* Progress: connected → approve */}
      <ol className="flex items-center gap-2 text-[11px] font-medium">
        <li className="inline-flex items-center gap-1.5 text-neon">
          <Check className="size-3.5" weight="bold" /> Wallet connected
        </li>
        <span className="h-px flex-1 bg-white/10" />
        <li className={cn('inline-flex items-center gap-1.5', busy ? 'text-foreground' : 'text-muted-foreground')}>
          <span className={cn('size-1.5 rounded-full', busy ? 'animate-pulse bg-neon' : 'bg-current')} /> Approve
        </li>
      </ol>

      {/* Connected wallet chip */}
      <div className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3">
        {wallet?.adapter.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={wallet.adapter.icon} alt="" className="size-7 shrink-0 rounded-md" />
        ) : null}
        <span className="flex min-w-0 flex-col">
          <span className="font-mono text-sm">{short}</span>
          <span className="text-[11px] text-muted-foreground">{wallet?.adapter.name ?? 'Wallet'}</span>
        </span>
        <button
          type="button"
          onClick={() => void disconnect()}
          className="ml-auto text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Change
        </button>
      </div>

      {/* State-driven status — the primary instruction */}
      <div className="flex flex-col items-center gap-3 py-1 text-center">
        <div className={cn('grid size-14 place-items-center rounded-full border', status.ring)}>{status.icon}</div>
        <div className="space-y-1">
          <p className="font-heading text-base font-medium">{status.title}</p>
          <p className="mx-auto max-w-[17rem] text-sm leading-relaxed text-muted-foreground">{status.detail}</p>
        </div>
      </div>

      {/* Reassurance */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-neon" /> Not a transaction</span>
        <span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-neon" weight="bold" /> Free · no gas</span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button shape="pill" className="w-full" onClick={() => signIn.mutate()} disabled={busy}>
          {busy ? (
            <>
              <CircleNotch className="size-4 animate-spin" /> Waiting for approval…
            </>
          ) : errored ? (
            'Try again'
          ) : (
            <>
              <ShieldCheck className="size-4" /> Approve in wallet
            </>
          )}
        </Button>
        <Button variant="ghost" shape="pill" className="w-full" onClick={() => void disconnect()}>
          Use a different wallet
        </Button>
      </div>
    </div>
  );
}
