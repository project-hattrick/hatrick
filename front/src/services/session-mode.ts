import { env } from '@/lib/env';
import { useAuthStore } from '@/store/auth.store';
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

/** Play-money balance for a mock (backend-off) session — mirrors the wallet seed. */
export const MOCK_SEED_BALANCE = 28_105_820;

/** Build a local session user from a connected wallet (mock mode — no server). */
export const mockUser = (walletAddress: string): AuthUser => ({
  id: `mock-${walletAddress.slice(0, 10)}`,
  walletAddress,
  displayName: null,
  balance: String(MOCK_SEED_BALANCE),
  username: null,
  country: null,
  bio: null,
  portraitSrc: null,
});
