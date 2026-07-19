'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';

import { authService } from '@/services/auth.service';
import { env } from '@/lib/env';
import { useAuthStore } from '@/store/auth.store';
import { backendEnabled, mockUser, signOutLocal } from '@/services/session-mode';
import { useSignInMutation } from './use-sign-in';
import { useSession } from './use-session';
import { queryKeys } from './keys';

/** How long to wait for Privy's client-created embedded wallet before exchanging the token anyway. */
const WALLET_WAIT_MS = 12_000;

/**
 * DRIVER hook — owns boot hydration + the Privy auto-exchange effect. Mount it exactly
 * ONCE (in WalletAuthSync). Components that only *read* auth state use useAuth().
 *
 * Flow: `useSession()` validates the cookie on boot (status unknown→authed/guest).
 * When Privy becomes `ready && authenticated` but no backend session exists, it
 * auto-exchanges the Privy token via POST /auth/login for a backend session cookie.
 * When Privy logs out it clears the backend session + local state.
 */
export function useWalletAuth() {
  const { ready, authenticated, user, getAccessToken, logout: privyLogout } = usePrivy();
  const { publicKey } = useWallet(); // still needed by mock mode + other verticals
  const queryClient = useQueryClient();
  const status = useAuthStore((s) => s.status);
  const setSession = useAuthStore((s) => s.setSession);
  const { exchangeToken } = useSignInMutation();
  useSession(); // boot hydration: GET /auth/session → store status (no-op in mock mode)

  const inFlight = useRef(false);
  const wasAuthenticated = useRef(false);
  const walletWaitStart = useRef<number | null>(null);
  const [, forceRecheck] = useState(0);

  // Privy creates the embedded Solana wallet client-side (createOnLogin) a beat AFTER auth. In chain
  // mode we must NOT exchange the token before it exists, or the backend resolves the user first and
  // mints a SERVER-side wallet — which can't be used for one-tap play (session signers). Gate on the
  // wallet's presence; the effect re-runs when it lands (user updates).
  const hasSolanaWallet = useMemo(() => {
    const accounts = (user?.linkedAccounts ?? []) as unknown as Array<Record<string, unknown>>;
    return accounts.some(
      (a) => a.type === 'wallet' && a.chainType === 'solana' && a.walletClientType === 'privy',
    );
  }, [user]);

  useEffect(() => {
    if (!ready) return;

    if (!authenticated) {
      // Privy is now signed out. If the user WAS authenticated this page load, tear down.
      if (wasAuthenticated.current && status !== 'guest') {
        const teardown = () => {
          signOutLocal();
          queryClient.setQueryData(queryKeys.authMe(), null);
          queryClient.removeQueries({ queryKey: queryKeys.walletTransactions() });
          queryClient.removeQueries({ queryKey: queryKeys.fantasySession() });
          queryClient.removeQueries({ queryKey: queryKeys.betsSession() });
        };
        if (backendEnabled) void authService.logout().finally(teardown);
        else teardown();
      }
      inFlight.current = false;
      walletWaitStart.current = null; // reset the wallet-wait window for the next sign-in
      return;
    }

    wasAuthenticated.current = true;

    if (!backendEnabled) {
      // Mock mode: build a local session from the wallet address (no server call).
      const wallet = publicKey?.toBase58() ?? 'mock-privy-user';
      setSession(mockUser(wallet));
      return;
    }

    // Wait for cookie hydration before deciding — avoids a needless re-exchange when a
    // valid backend session cookie already exists from a previous page load.
    if (status === 'unknown') return;
    if (status === 'authed') return; // already has a backend session
    if (inFlight.current) return;

    // Chain mode: hold the token exchange until Privy's client embedded Solana wallet exists, so the
    // backend never falls back to a SERVER-created wallet (unusable for one-tap play). Bounded — after
    // WALLET_WAIT_MS we proceed regardless, so a wallet-creation hiccup can't block sign-in forever.
    if (env.chainEnabled && !hasSolanaWallet) {
      if (walletWaitStart.current == null) walletWaitStart.current = Date.now();
      if (Date.now() - walletWaitStart.current < WALLET_WAIT_MS) {
        const id = window.setTimeout(() => forceRecheck((n) => n + 1), 500);
        return () => window.clearTimeout(id);
      }
    }

    inFlight.current = true;
    void exchangeToken().finally(() => {
      inFlight.current = false;
    });
  }, [
    ready,
    authenticated,
    hasSolanaWallet,
    status,
    publicKey,
    exchangeToken,
    setSession,
    queryClient,
    getAccessToken,
    privyLogout,
  ]);
}
