'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';

import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useProfileStore } from '@/store/profile.store';
import { useWalletStore } from '@/store/wallet.store';
import { queryKeys } from './keys';

/** Base64-encode raw signature bytes for transport (api decodes with Buffer). */
const toBase64 = (bytes: Uint8Array): string =>
  btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));

/**
 * The wallet sign-in mutation: nonce → signMessage → verify → session JWT.
 * No auto-effect — safe to call from any component (e.g. the login dialog's
 * "sign" button). The auto-connect driver is useWalletAuth (WalletAuthSync).
 */
export function useSignInMutation() {
  const { publicKey, signMessage } = useWallet();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const setAuthenticating = useAuthStore((s) => s.setAuthenticating);
  const setError = useAuthStore((s) => s.setError);

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet does not support message signing');
      }
      const walletAddress = publicKey.toBase58();
      const { message } = await authService.requestNonce(walletAddress);
      const signature = await signMessage(new TextEncoder().encode(message));
      // verify sets the httpOnly session cookie server-side; we mirror the user locally.
      const session = await authService.verify(walletAddress, toBase64(signature));
      setSession(session.user);
      useProfileStore.getState().hydrateFromServer(session.user);
      useWalletStore.getState().hydrate(Number(session.user.balance));
      queryClient.setQueryData(queryKeys.authMe(), session.user);
      // Onboarding only for a brand-new account (first registration).
      if (session.isNew) useOnboardingStore.getState().begin(session.user.walletAddress);
    },
    onMutate: () => {
      setAuthenticating(true);
      setError(null);
    },
    onError: (e) => setError((e as Error)?.message ?? 'Sign-in failed'),
    onSettled: () => setAuthenticating(false),
  });
}
