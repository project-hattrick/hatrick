'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useProfileStore } from '@/store/profile.store';
import { useWalletStore } from '@/store/wallet.store';
import { queryKeys } from './keys';

export interface EmailSignInInput {
  email: string;
  password: string;
}

/**
 * Email sign-in-or-register mutation (Collector tier) — the wallet-free twin of
 * useSignInMutation: same session hydration, no wallet adapter involved.
 */
export function useEmailSignInMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const setAuthenticating = useAuthStore((s) => s.setAuthenticating);
  const setError = useAuthStore((s) => s.setError);

  return useMutation({
    mutationFn: async ({ email, password }: EmailSignInInput): Promise<void> => {
      // The api sets the httpOnly session cookie; we mirror the user locally.
      const session = await authService.signInWithEmail(email, password);
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
