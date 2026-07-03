'use client';

import { useMutation } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';

import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

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
  const setSession = useAuthStore((s) => s.setSession);
  const setAuthenticating = useAuthStore((s) => s.setAuthenticating);

  return useMutation({
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
    onMutate: () => setAuthenticating(true),
    onSettled: () => setAuthenticating(false),
  });
}
