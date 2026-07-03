'use client';

import { useWalletAuth } from '@/services/queries/use-wallet-auth';

/**
 * Headless component that drives wallet sign-in app-wide. Mounted once inside the
 * providers (within WalletProvider) so the session follows connect/disconnect.
 */
export function WalletAuthSync(): null {
  useWalletAuth();
  return null;
}
