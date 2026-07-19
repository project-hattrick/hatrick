'use client';

import { useCallback } from 'react';
import { usePrivy, useLogin } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';

import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';
import { useWalletStore } from '@/store/wallet.store';
import { queryKeys } from './keys';

/**
 * Privy-based sign-in hook. Exposes a `signIn()` that opens the Privy modal.
 * When Privy becomes authenticated it exchanges the access token for a backend
 * session cookie via POST /auth/login and syncs the auth store.
 *
 * The auto-connect driver still lives in useWalletAuth (WalletAuthSync).
 */
export function useSignInMutation() {
  const { getAccessToken, authenticated, ready } = usePrivy();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const setAuthenticating = useAuthStore((s) => s.setAuthenticating);
  const setError = useAuthStore((s) => s.setError);

  /** Exchange a fresh Privy token for a backend session cookie and update stores. */
  const exchangeToken = useCallback(async () => {
    setAuthenticating(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Privy returned no access token');
      const user = await authService.login(token);
      setSession(user);
      useProfileStore.getState().hydrateFromServer(user);
      useWalletStore.getState().hydrate(Number(user.balance));
      queryClient.setQueryData(queryKeys.authMe(), user);
    } catch (e) {
      setError((e as Error)?.message ?? 'Sign-in failed');
    } finally {
      setAuthenticating(false);
    }
  }, [getAccessToken, setSession, setAuthenticating, setError, queryClient]);

  const { login: privyLogin } = useLogin({
    onComplete: () => {
      // Privy is now authenticated — exchange the token for a backend session.
      void exchangeToken();
    },
    onError: (err: unknown) => {
      setError(typeof err === 'string' ? err : (err as Error)?.message ?? 'Sign-in failed');
    },
  });

  /** Opens the Privy modal; auto-exchanges the token on success. */
  const signIn = useCallback(() => {
    if (ready && authenticated) {
      // Already Privy-authenticated but backend session may be stale.
      void exchangeToken();
      return;
    }
    privyLogin();
  }, [ready, authenticated, privyLogin, exchangeToken]);

  return { signIn, exchangeToken };
}
