'use client';

import { useEffect, useRef, useState } from 'react';
import { useLoginWithSiws, usePrivy } from '@privy-io/react-auth';
import { useCreateWallet } from '@privy-io/react-auth/solana';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import Image from 'next/image';

import {
  Envelope,
  GoogleLogo,
  ShieldCheck,
  CaretRight,
  CircleNotch,
  Trophy,
  Cards,
  Wallet as WalletIcon,
  Warning,
  ArrowSquareOut,
} from '@/components/common/icons';
import { backendEnabled, signInAsGuest } from '@/services/session-mode';
import { useSignInMutation } from '@/services/queries/use-sign-in';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

/**
 * Step 1 of login — a two-tier chooser:
 *  - "I want to win": lists detected wallets inline and signs in via SIWS (no Privy modal).
 *  - "Just open packs & stats": casual Email entry via OTP form.
 * In mock mode both options fall back to the local guest session.
 */
export function WalletStep({ onEmail }: { onEmail?: () => void }) {
  const { wallets, select, connect, publicKey, signMessage, wallet, connected } = useWallet();
  const { generateSiwsMessage, loginWithSiws } = useLoginWithSiws();
  const { authenticated, logout: privyLogout } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signIn } = useSignInMutation();
  const setLoginOpen = useUiStore((s) => s.setLoginOpen);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Name of the wallet we're waiting to connect before firing SIWS
  const pendingWallet = useRef<string | null>(null);

  const continueCasual = () => {
    signInAsGuest();
    setLoginOpen(false);
  };

  // Opens Privy's own modal (email or wallet). Unlike direct Phantom SIWS this provisions a Privy
  // EMBEDDED Solana wallet, which is what one-tap play (session-signer delegation) needs. In mock
  // mode there's no Privy, so fall back to the local guest session.
  const continueWithPrivy = () => {
    if (!backendEnabled) {
      continueCasual();
      return;
    }
    setError(null);
    signIn();
  };

  const doSiws = async () => {
    const address = publicKey?.toBase58();
    if (!address || !signMessage) return;

    try {
      // Clear any stale Privy session first. Otherwise loginWithSiws is treated as
      // "add this wallet as a signer to the current user" and fails with
      // "Address to add signers too is not associated with current user" when the
      // signing address isn't already linked to that leftover session.
      if (authenticated) await privyLogout();

      const message = await generateSiwsMessage({ address });
      const encoded = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(encoded);
      const signature = Buffer.from(signatureBytes).toString('base64');
      await loginWithSiws({
        message,
        signature,
        walletClientType: wallet?.adapter.name?.toLowerCase() ?? undefined,
      });
      // Provision the Privy EMBEDDED Solana wallet NOW — before useWalletAuth exchanges the token.
      // Otherwise the exchange can time out waiting for it and the backend mints a SERVER wallet that
      // can't do one-tap play ("User does not control server wallet"). Idempotent: ignore "already exists".
      try {
        await createWallet();
      } catch (walletErr) {
        const m = (walletErr as Error)?.message ?? '';
        if (!/already|exists/i.test(m)) throw walletErr;
      }
      // success — useWalletAuth driver picks it up automatically
    } catch (e) {
      const msg = (e as Error)?.message ?? 'Wallet sign-in failed.';
      if (!msg.toLowerCase().includes('user rejected') && !msg.toLowerCase().includes('cancelled')) {
        setError(msg);
      }
    } finally {
      setBusy(false);
      pendingWallet.current = null;
    }
  };

  // When the wallet we selected becomes connected, fire SIWS
  useEffect(() => {
    if (
      pendingWallet.current &&
      connected &&
      publicKey &&
      wallet?.adapter.name === pendingWallet.current
    ) {
      void doSiws();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey, wallet?.adapter.name]);

  const handleWalletClick = (walletName: string) => {
    if (!backendEnabled) {
      continueCasual();
      return;
    }

    setError(null);
    setBusy(true);

    // Already connected with this exact wallet — go straight to SIWS
    if (connected && publicKey && wallet?.adapter.name === walletName) {
      void doSiws();
      return;
    }

    pendingWallet.current = walletName;
    select(walletName as Parameters<typeof select>[0]);
    // connect() is called inside a useEffect after select updates state
  };

  // After select() updates the wallet in state, trigger connect()
  useEffect(() => {
    if (pendingWallet.current && wallet?.adapter.name === pendingWallet.current && !connected) {
      void connect().catch((e) => {
        const msg = (e as Error)?.message ?? '';
        if (!msg.toLowerCase().includes('user rejected') && !msg.toLowerCase().includes('cancelled')) {
          setError(msg || 'Failed to connect wallet.');
        }
        setBusy(false);
        pendingWallet.current = null;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet?.adapter.name]);

  // Wallets installed in the browser
  const installedWallets = wallets.filter(
    (w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable,
  );

  return (
    <div className="space-y-4">
      {/* Tier 1 — compete with a wallet */}
      <section className="space-y-2">
        <TierHeading
          icon={<Trophy className="size-4 text-neon" weight="duotone" />}
          title="I want to win"
          detail="Connect a wallet to compete for prizes and own your cards on-chain."
        />

        {installedWallets.length > 0 ? (
          <ul className="space-y-2">
            {installedWallets.map((w) => {
              const isActive = busy && pendingWallet.current === w.adapter.name;
              return (
                <li key={w.adapter.name}>
                  <button
                    type="button"
                    onClick={() => handleWalletClick(w.adapter.name)}
                    disabled={busy}
                    className="group flex h-[58px] w-full items-center gap-3 rounded-[14px] border border-border bg-surface-1 px-4 text-left transition-colors hover:bg-surface-2 disabled:opacity-70"
                  >
                    {w.adapter.icon ? (
                      <Image
                        src={w.adapter.icon}
                        alt={w.adapter.name}
                        width={28}
                        height={28}
                        className="shrink-0 rounded-md"
                        unoptimized
                      />
                    ) : (
                      <WalletIcon className="size-7 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-body font-bold">{w.adapter.name}</span>
                      <span className="text-caption text-muted-foreground">
                        {w.readyState === WalletReadyState.Installed ? 'Detected' : 'Available'}
                      </span>
                    </span>
                    <span className="ml-auto flex items-center gap-2">
                      {isActive ? (
                        <CircleNotch className="size-4 animate-spin text-muted-foreground" />
                      ) : (
                        <CaretRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          /* No wallet extension detected */
          <a
            href="https://phantom.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[58px] w-full items-center gap-3 rounded-[14px] border border-border bg-surface-1 px-4 text-left transition-colors hover:bg-surface-2"
          >
            <WalletIcon className="size-7 shrink-0 text-muted-foreground" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-body font-bold">Install Phantom</span>
              <span className="text-caption text-muted-foreground">No wallet detected</span>
            </span>
            <ArrowSquareOut className="ml-auto size-4 text-muted-foreground" />
          </a>
        )}

        {/* Privy — email or wallet through Privy. Provisions an embedded Solana wallet, so one-tap
            play (co-signing packs/bets/duels) works without a per-action popup. */}
        <button
          type="button"
          onClick={continueWithPrivy}
          disabled={busy}
          className="group flex h-[58px] w-full items-center gap-3 rounded-[14px] border border-border bg-surface-1 px-4 text-left transition-colors hover:bg-surface-2 disabled:opacity-70"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-neon/10">
            <ShieldCheck className="size-[18px] text-neon" weight="fill" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body font-bold">Continue with Privy</span>
            <span className="text-caption text-muted-foreground">Email or wallet · enables one-tap play</span>
          </span>
          <CaretRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <Warning className="size-3.5 shrink-0" />
          {error}
        </div>
      )}

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
