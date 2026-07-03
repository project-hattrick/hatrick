'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';

import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

/** Base64-encode raw signature bytes for transport (api decodes with Buffer). */
const toBase64 = (bytes: Uint8Array): string =>
  btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));

/**
 * Wallet sign-in: nonce → signMessage → verify → session JWT (Zustand-persisted).
 * Auto-runs when a wallet connects without a matching session, and clears the
 * session on disconnect. All network access goes through authService.
 */
export function useWalletAuth() {
  const { publicKey, signMessage, connected } = useWallet();
  const { token, user, setSession, clear } = useAuthStore();
  const inFlight = useRef(false);

  const signIn = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet does not support message signing');
      }
      const walletAddress = publicKey.toBase58();
      const { message } = await authService.requestNonce(walletAddress);
      const signature = await signMessage(new TextEncoder().encode(message));
      const session = await authService.verify(walletAddress, toBase64(signature));
      setSession(session.token, session.user);
    },
  });

  const { mutate } = signIn;
  const wallet = publicKey?.toBase58() ?? null;
  const authedWallet = user?.walletAddress ?? null;

  // Auto sign-in once per fresh connection; clear the session on disconnect.
  useEffect(() => {
    if (!connected) {
      if (token) clear();
      inFlight.current = false;
      return;
    }
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
