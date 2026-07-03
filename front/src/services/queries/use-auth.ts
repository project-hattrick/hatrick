'use client';

import { useWallet } from '@solana/wallet-adapter-react';

import { useAuthStore } from '@/store/auth.store';

/**
 * Read-only auth status for UI (navbar, avatar, gated buttons). Does NOT run the
 * sign-in flow — that lives in useWalletAuth (mounted once in WalletAuthSync).
 */
export function useAuth() {
  const { connected, connecting } = useWallet();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const authenticating = useAuthStore((s) => s.authenticating);

  return {
    user,
    token,
    isConnected: connected,
    isConnecting: connecting,
    isAuthenticated: Boolean(token),
    isAuthenticating: authenticating,
  };
}
