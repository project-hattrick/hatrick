'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQueryClient } from '@tanstack/react-query';

import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { backendEnabled, mockUser, signOutLocal } from '@/services/session-mode';
import { useSignInMutation } from './use-sign-in';
import { useSession } from './use-session';
import { queryKeys } from './keys';

/**
 * DRIVER hook — owns boot hydration + the auto-connect effect. Mount it exactly
 * ONCE (in WalletAuthSync). Components that only *read* auth state use useAuth();
 * the sign-in mutation itself lives in useSignInMutation.
 *
 * Flow: `useSession()` validates the cookie on boot (status unknown→authed/guest).
 * Once resolved, a connected wallet with no matching session is signed in; a real
 * disconnect logs out (clears the server cookie + local session).
 */
export function useWalletAuth() {
  const { publicKey, signMessage, connected } = useWallet();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const setSession = useAuthStore((s) => s.setSession);
  const signIn = useSignInMutation();
  useSession(); // boot hydration: GET /auth/me → store status (no-op in mock mode)

  const inFlight = useRef(false);
  /** True once the adapter has connected in THIS page load — gates the disconnect-clear. */
  const wasConnected = useRef(false);

  const { mutate } = signIn;
  const wallet = publicKey?.toBase58() ?? null;
  const authedWallet = user?.walletAddress ?? null;
  const isAuthed = status === 'authed';

  useEffect(() => {
    if (!connected) {
      // Fresh page load: the adapter is still auto-reconnecting, so the persisted
      // session must survive — only a REAL disconnect (was connected → not) logs out.
      if (wasConnected.current && (isAuthed || user)) {
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
      return;
    }
    wasConnected.current = true;
    if (!wallet) return;
    if (wallet === authedWallet && isAuthed) return; // already authenticated

    if (!backendEnabled) {
      // Mock mode: establish a local session (no signing, no network).
      setSession(mockUser(wallet));
      return;
    }
    // Wait for cookie hydration before deciding — avoids a needless re-sign prompt
    // when a valid session cookie already exists.
    if (status === 'unknown') return;
    if (!signMessage) return;
    if (inFlight.current) return;

    inFlight.current = true;
    mutate(undefined, { onSettled: () => (inFlight.current = false) });
  }, [connected, wallet, authedWallet, isAuthed, status, user, signMessage, mutate, setSession, queryClient]);

  const retry = useCallback(() => mutate(), [mutate]);

  return {
    user,
    isAuthenticated: isAuthed && wallet === authedWallet,
    isAuthenticating: signIn.isPending,
    error: signIn.error,
    signIn: retry,
  };
}
