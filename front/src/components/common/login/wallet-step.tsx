'use client';

import { useEffect } from 'react';
import { useWallet, type Wallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

import { Envelope, GoogleLogo, ShieldCheck, CaretRight, CircleNotch, Wallet as WalletIcon } from '@/components/common/icons';
import { cn } from '@/lib/utils';

/** Installed wallets first, then everything else — keeps the detected one on top. */
const rank = (w: Wallet): number => (w.readyState === WalletReadyState.Installed ? 0 : 1);

/**
 * Step 1 of login (ref "Conecte sua carteira"): our own wallet chooser over the
 * Wallet-Standard list, so we never bounce to the adapter's default modal.
 * Selecting a wallet triggers connect; the app-wide driver then auto-signs.
 */
export function WalletStep() {
  const { wallets, select, wallet, connect, connecting } = useWallet();

  // select() lands async — connect once the selected wallet is actually set.
  useEffect(() => {
    if (wallet?.readyState === WalletReadyState.Installed) {
      void connect().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  const ordered = [...wallets].sort((a, b) => rank(a) - rank(b));

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {ordered.length === 0 ? (
          <li className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-muted-foreground">
            <WalletIcon className="size-5 shrink-0" />
            No Solana wallet detected. Install Phantom or Solflare to continue.
          </li>
        ) : (
          ordered.map((w) => (
            <WalletRow
              key={w.adapter.name}
              wallet={w}
              busy={connecting && wallet?.adapter.name === w.adapter.name}
              onSelect={() => select(w.adapter.name)}
            />
          ))
        )}
      </ul>

      <Divider label="or" />

      <div className="space-y-2">
        <AltRow icon={<Envelope className="size-5" />} label="Continue with Email" />
        <AltRow icon={<GoogleLogo className="size-5" />} label="Continue with Google" />
      </div>

      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-neon" /> Self-custody · Solana devnet
      </p>
    </div>
  );
}

function WalletRow({ wallet, busy, onSelect }: { wallet: Wallet; busy: boolean; onSelect: () => void }) {
  const detected = wallet.readyState === WalletReadyState.Installed;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        disabled={busy}
        className="group flex h-[58px] w-full items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.04] px-4 text-left transition-colors hover:bg-white/[0.07] disabled:opacity-70"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wallet.adapter.icon} alt="" className="size-7 shrink-0 rounded-md" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-bold">{wallet.adapter.name}</span>
          <span className="text-[11px] text-muted-foreground">{detected ? 'Browser wallet' : 'Not installed'}</span>
        </span>
        <span className="ml-auto flex items-center gap-2">
          {detected && !busy ? (
            <span className="rounded-[5px] bg-neon/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neon">Detected</span>
          ) : null}
          {busy ? (
            <CircleNotch className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <CaretRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          )}
        </span>
      </button>
    </li>
  );
}

/** Email/Google — visible for structure, gated until a backend supports them. */
function AltRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      disabled
      className={cn(
        'flex h-[52px] w-full items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.02] px-4 text-left text-sm font-semibold text-muted-foreground',
        'cursor-not-allowed opacity-60',
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
      <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">Soon</span>
    </button>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
      <span className="h-px flex-1 bg-white/10" />
      {label}
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
