'use client';

import { usePrivy } from '@privy-io/react-auth';

import { AccountType } from '@/enums/account-type.enum';
import { useAuthStore } from '@/store/auth.store';

/**
 * Read-only auth status for UI (navbar, avatar, gated buttons). Does NOT run the
 * sign-in flow — that lives in useWalletAuth (mounted once in WalletAuthSync).
 *
 * `isConnected` / `isConnecting` are now sourced from Privy (previously wallet adapter)
 * so the avatar button reflects Privy's auth lifecycle, not the Solana adapter state.
 */
export function useAuth() {
  const { ready, authenticated } = usePrivy();
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const authenticating = useAuthStore((s) => s.authenticating);
  const error = useAuthStore((s) => s.error);

  return {
    user,
    status,
    error,
    /** True while Privy has a live authenticated session. */
    isConnected: authenticated,
    /** True while Privy is initialising (not yet ready). */
    isConnecting: !ready,
    isAuthenticated: status === 'authed',
    isAuthenticating: authenticating,
    /** Wallet-linked tier — gates staked/on-chain features; Collectors see packs & stats only. */
    isCompetitor: status === 'authed' && user?.accountType === AccountType.Competitor,
  };
}
