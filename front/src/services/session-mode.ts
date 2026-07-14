import { env } from '@/lib/env';
import { AccountType } from '@/enums/account-type.enum';
import { RankTier } from '@/enums/rank-tier.enum';
import { Presence } from '@/enums/presence.enum';
import { useAuthStore } from '@/store/auth.store';
import { useWalletStore } from '@/store/wallet.store';
import { useFantasyStore } from '@/store/fantasy.store';
import { useBetsStore } from '@/store/bets.store';
import { useFriendsStore } from '@/store/friends.store';
import { useNotificationsStore } from '@/store/notifications.store';
import type { AuthUser } from '@/services/auth.service';

/**
 * Master integration flag. `NEXT_PUBLIC_USE_MOCK=true` → the app runs fully local
 * (no backend calls, a local mock session on wallet connect); `false` → real
 * backend integration (nonce/verify sign-in, server persistence + hydration).
 */
export const backendEnabled = !env.useMock;

/**
 * True only when persistence should hit the server: the backend is enabled AND the
 * user has a real authenticated session. Every store/service gates writes on this so
 * a mock session (backend off) never makes a network call.
 */
export const isBackendSession = (): boolean =>
  backendEnabled && useAuthStore.getState().status === 'authed';

/**
 * True when the on-chain path is active: chain flag is enabled, the user has an
 * authenticated backend session, and the auth user has a wallet address. Components
 * that also need `publicKey` from the wallet adapter should use `useIsChainSession()`
 * (React hook) instead.
 */
export const isChainSession = (): boolean =>
  env.chainEnabled && isBackendSession() && !!useAuthStore.getState().user?.walletAddress;

/** Play-money balance for a mock (backend-off) session — mirrors the wallet seed. */
export const MOCK_SEED_BALANCE = 28_105_820;

/** Build a local session user from a connected wallet (mock mode — no server). */
export const mockUser = (
  walletAddress: string,
  accountType: AccountType = AccountType.Competitor,
): AuthUser => ({
  id: `mock-${walletAddress.slice(0, 10)}`,
  walletAddress,
  accountType,
  displayName: null,
  balance: String(MOCK_SEED_BALANCE),
  username: null,
  country: null,
  bio: null,
  portraitSrc: null,
  // Starter demo stats — mirror the backend's backfill so mock mode presents the same.
  createdAt: '2026-01-14T00:00:00.000Z',
  mmr: 1420,
  tier: RankTier.Gold,
  division: 'II',
  wins: 128,
  losses: 74,
  streak: 'W5',
  presence: Presence.Online,
});

/** Synthetic address for the wallet-free demo session — stable so its id/persistence are consistent. */
const GUEST_ADDRESS = 'GuestDemo1111111111111111111111111111111111';

/** Wallet-free demo sign-in — establishes a local mock session with no extension, signing or network. */
export const signInAsGuest = (): void => {
  // Casual tier: no wallet means no staked play — packs, stats and friendlies only.
  useAuthStore.getState().setSession(mockUser(GUEST_ADDRESS, AccountType.Collector));
};

/** Local sign-out — clears the session and resets the play-money stores (no wallet to disconnect). */
export const signOutLocal = (): void => {
  useAuthStore.getState().clear();
  useWalletStore.getState().reset();
  useFantasyStore.getState().reset();
  useBetsStore.getState().reset();
  // Server-owned state — drop it so the next account doesn't see a stale graph/bell.
  // Mock mode keeps its local seeds across sign-outs, as before.
  if (backendEnabled) {
    useFriendsStore.getState().reset();
    useNotificationsStore.getState().hydrate([]);
  }
};
