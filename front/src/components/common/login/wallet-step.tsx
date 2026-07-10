'use client';

import { useEffect } from 'react';
import { useWallet, type Wallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

import { Envelope, GoogleLogo, ShieldCheck, CaretRight, CircleNotch, Trophy, Cards, Wallet as WalletIcon } from '@/components/common/icons';
import { backendEnabled, signInAsGuest } from '@/services/session-mode';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

/** Installed wallets first, then everything else — keeps the detected one on top. */
const rank = (w: Wallet): number => (w.readyState === WalletReadyState.Installed ? 0 : 1);

/**
 * A wallet we can actually start a connection with:
 *  - `Installed` → injected provider present (desktop extension / Phantom in-app browser).
 *  - `Loadable`  → not injected here, but connectable via deep link (Phantom on mobile).
 * `NotDetected`/`Unsupported` rows are hidden so we don't offer dead buttons.
 */
const isConnectable = (w: Wallet): boolean =>
  w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable;

/**
 * Step 1 of login — a two-tier chooser:
 *  - "I want to win": connect a Solana wallet (Phantom & co.) to compete with real ownership.
 *  - "Just open packs & stats": casual Email/Google entry, no wallet required.
 * Wallet rows come from the Wallet-Standard list so we never bounce to the adapter's
 * default modal. Selecting a wallet triggers connect; the app-wide driver then auto-signs.
 */
export function WalletStep({ onEmail }: { onEmail?: () => void }) {
  const { wallets, select, wallet, connect, connecting } = useWallet();
  const setLoginOpen = useUiStore((s) => s.setLoginOpen);

  // select() lands async — connect once the selected wallet is actually set.
  // Loadable (mobile Phantom) also connects: connect() triggers the deep link
  // that reopens the app inside Phantom's in-app browser.
  useEffect(() => {
    if (wallet && isConnectable(wallet)) {
      void connect().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet]);

  // Wallet-free demo sign-in: establish a local mock session and close the dialog.
  const continueCasual = () => {
    signInAsGuest();
    setLoginOpen(false);
  };

  // Only show wallets we can connect to; sort installed/detected on top.
  const ordered = wallets.filter(isConnectable).sort((a, b) => rank(a) - rank(b));

  return (
    <div className="space-y-4">
      {/* Tier 1 — compete with a wallet */}
      <section className="space-y-2">
        <TierHeading
          icon={<Trophy className="size-4 text-neon" weight="duotone" />}
          title="I want to win"
          detail="Connect a wallet to compete for prizes and own your cards on-chain."
        />
        <ul className="space-y-2">
          {ordered.length === 0 ? (
            <li className="flex items-center gap-3 rounded-[14px] border border-border bg-surface-1 px-4 py-4 text-sm text-muted-foreground">
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
      </section>

      <Divider label="or" />

      {/* Tier 2 — casual, wallet-free entry */}
      <section className="space-y-2">
        <TierHeading
          icon={<Cards className="size-4 text-neon" weight="duotone" />}
          title="Just open packs & see stats"
          detail="Play the fantasy game and follow live matches — no wallet needed."
        />
        <AltRow
          icon={<Envelope className="size-5" />}
          label="Continue with Email"
          badge={backendEnabled ? null : 'Demo'}
          onSelect={backendEnabled ? onEmail : continueCasual}
        />
        <AltRow
          icon={<GoogleLogo className="size-5" />}
          label="Continue with Google"
          badge={backendEnabled ? 'Soon' : 'Demo'}
          onSelect={backendEnabled ? undefined : continueCasual}
        />
      </section>

      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-neon" /> Self-custody · Solana devnet
      </p>
    </div>
  );
}

function TierHeading({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="space-y-0.5">
      <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
        {icon}
        {title}
      </p>
      <p className="text-caption text-muted-foreground">{detail}</p>
    </div>
  );
}

function WalletRow({ wallet, busy, onSelect }: { wallet: Wallet; busy: boolean; onSelect: () => void }) {
  const detected = wallet.readyState === WalletReadyState.Installed;
  // Loadable = connectable via deep link (Phantom on a mobile browser).
  const loadable = wallet.readyState === WalletReadyState.Loadable;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        disabled={busy}
        className="group flex h-[58px] w-full items-center gap-3 rounded-[14px] border border-border bg-surface-1 px-4 text-left transition-colors hover:bg-surface-2 disabled:opacity-70"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wallet.adapter.icon} alt="" className="size-7 shrink-0 rounded-md" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body font-bold">{wallet.adapter.name}</span>
          <span className="text-caption text-muted-foreground">
            {detected ? 'Browser wallet' : loadable ? 'Open in the app' : 'Not installed'}
          </span>
        </span>
        <span className="ml-auto flex items-center gap-2">
          {detected && !busy ? (
            <span className="rounded-sm bg-neon/15 px-2 py-0.5 text-micro font-bold uppercase tracking-wide text-neon">Detected</span>
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

/**
 * Email/Google entry. `onSelect` opens the email form (backend mode) or starts
 * the wallet-free demo session (mock mode); without it the row stays gated.
 */
function AltRow({
  icon,
  label,
  badge,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  badge: string | null;
  onSelect?: () => void;
}) {
  const enabled = Boolean(onSelect);
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onSelect}
      className={cn(
        'flex h-[52px] w-full items-center gap-3 rounded-[14px] border border-border bg-surface-1 px-4 text-left text-sm font-semibold',
        enabled
          ? 'text-foreground transition-colors hover:bg-surface-2'
          : 'cursor-not-allowed text-muted-foreground opacity-60',
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
      {badge && (
        <span
          className={cn(
            'ml-auto rounded-full border px-2 py-0.5 text-micro font-bold uppercase tracking-wide',
            enabled ? 'border-neon/35 text-neon' : 'border-border',
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-caption font-medium uppercase tracking-widest text-muted-foreground/60">
      <span className="h-px flex-1 bg-surface-2" />
      {label}
      <span className="h-px flex-1 bg-surface-2" />
    </div>
  );
}
