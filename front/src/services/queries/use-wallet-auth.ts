'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

import { useAuthStore } from '@/store/auth.store';
import { useSignInMutation } from './use-sign-in';

/**
 * DRIVER hook — owns the auto-connect effect. Mount it exactly ONCE (in
 * WalletAuthSync). Components that only *read* auth state use useAuth(); the
 * sign-in mutation itself lives in useSignInMutation.
 *
 * Auto-runs sign-in when a wallet connects without a matching session; clears
 * the session on disconnect.
 */
export function useWalletAuth() {
  const { publicKey, signMessage, connected } = useWallet();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const signIn = useSignInMutation();
  const inFlight = useRef(false);
  /** True once the adapter has connected in THIS page load — gates the disconnect-clear. */
  const wasConnected = useRef(false);

  const { mutate } = signIn;
  const wallet = publicKey?.toBase58() ?? null;
  const authedWallet = user?.walletAddress ?? null;

  useEffect(() => {
    if (!connected) {
      // On a fresh page load the adapter is still auto-reconnecting (connected=false), so the
      // persisted session must survive — only a REAL disconnect (connected true → false) clears it.
      // Clearing here used to wipe the stored JWT on every refresh and force a new Phantom sign-in.
      if (wasConnected.current && token) clear();
      inFlight.current = false;
      return;
    }
    wasConnected.current = true;
    if (!signMessage || !wallet) return;
    if (wallet === authedWallet && token) return; // already authenticated
    if (inFlight.current) return;

    inFlight.current = true;
    mutate(undefined, { onSettled: () => (inFlight.current = false) });
  }, [connected, wallet, authedWallet, token, signMessage, clear, mutate]);

  const retry = useCallback(() => mutate(), [mutate]);

  return {
    token,
    user,
    isAuthenticated: Boolean(token) && wallet === authedWallet,
    isAuthenticating: signIn.isPending,
    error: signIn.error,
    signIn: retry,
  };
}
