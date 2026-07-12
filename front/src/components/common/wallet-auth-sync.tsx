'use client';

import { useWalletAuth } from '@/services/queries/use-wallet-auth';
import { useFantasySession } from '@/services/queries/use-fantasy-session';
import { useBetsSession } from '@/services/queries/use-bets-session';
import { useNotificationsSession } from '@/services/queries/use-notifications-session';
import { useFriends } from '@/services/queries/use-friends';
import { useUserChannel } from '@/services/realtime/use-user-channel';

/**
 * Headless component that drives wallet sign-in app-wide. Mounted once inside the
 * providers (within WalletProvider) so the session follows connect/disconnect, and
 * hydrates the fantasy collection/XI, bets, notifications and friends from the
 * server once authenticated. useUserChannel keeps the bell live via socket pushes.
 */
export function WalletAuthSync(): null {
  useWalletAuth();
  useFantasySession();
  useBetsSession();
  useNotificationsSession();
  useFriends();
  useUserChannel();
  return null;
}
