'use client';

import { useWalletAuth } from '@/services/queries/use-wallet-auth';
import { useFantasySession } from '@/services/queries/use-fantasy-session';

/**
 * Headless component that drives wallet sign-in app-wide. Mounted once inside the
 * providers (within WalletProvider) so the session follows connect/disconnect, and
 * hydrates the fantasy collection/XI from the server once authenticated.
 */
export function WalletAuthSync(): null {
  useWalletAuth();
  useFantasySession();
  return null;
}
