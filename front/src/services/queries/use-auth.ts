'use client';

import { useWallet } from '@solana/wallet-adapter-react';

import { AccountType } from '@/enums/account-type.enum';
import { useAuthStore } from '@/store/auth.store';

/**
 * Read-only auth status for UI (navbar, avatar, gated buttons). Does NOT run the
 * sign-in flow — that lives in useWalletAuth (mounted once in WalletAuthSync).
 */
export function useAuth() {
  const { connected, connecting } = useWallet();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const authenticating = useAuthStore((s) => s.authenticating);
  const error = useAuthStore((s) => s.error);

  return {
    user,
    status,
    error,
    isConnected: connected,
    isConnecting: connecting,
    isAuthenticated: status === 'authed',
    isAuthenticating: authenticating,
    /** Wallet-linked tier — gates staked/on-chain features; Collectors see packs & stats only. */
    isCompetitor: status === 'authed' && user?.accountType === AccountType.Competitor,
  };
}
