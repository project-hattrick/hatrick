import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { env } from '@/lib/env';
import type { AuthUser } from '@/services/auth.service';

/** Session lifecycle: 'unknown' until /auth/me resolves on boot, then guest/authed. */
export type AuthStatus = 'unknown' | 'guest' | 'authed';

interface AuthStore {
  user: AuthUser | null;
  /** Source of truth for gating — the JWT itself lives in an httpOnly cookie, not here. */
  status: AuthStatus;
  /** True while the sign-in mutation is running (shared across UI). */
  authenticating: boolean;
  /** Last sign-in failure, so the login dialog can surface the headless driver's error. */
  error: string | null;
  /** Signed in (from /auth/me hydration or a fresh verify). */
  setSession: (user: AuthUser) => void;
  /** Confirmed signed-out by the server (no/expired cookie). */
  setGuest: () => void;
  setAuthenticating: (value: boolean) => void;
  setError: (error: string | null) => void;
  /** Explicit logout — same end state as guest. */
  clear: () => void;
  /** A guarded request came back 401 — reconcile to signed-out. */
  onUnauthorized: () => void;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const guestState = { user: null, status: 'guest' as AuthStatus, authenticating: false };

/**
 * Wallet session state. The JWT is an httpOnly cookie (invisible to JS), so this
 * store only mirrors the *user* for instant paint — `GET /auth/me` on boot is the
 * authority that flips `status` to authed/guest. `user` is persisted for a
 * flash-free reload; `status`/`authenticating` are not (always re-validated).
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      status: 'unknown',
      authenticating: false,
      error: null,
      setSession: (user) => set({ user, status: 'authed', authenticating: false, error: null }),
      setGuest: () => set(guestState),
      setAuthenticating: (authenticating) => set({ authenticating }),
      setError: (error) => set({ error }),
      clear: () => set({ ...guestState, error: null }),
      onUnauthorized: () => set(guestState),
    }),
    {
      name: 'hat-trick-auth',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : localStorage,
      ),
      // Backend mode re-validates the cookie on boot, so only `user` is persisted (for a
      // flash-free paint); `status` is not. Mock mode has no server to re-validate against,
      // so the local session (incl. a wallet-free guest) must persist `status` to survive a reload.
      partialize: (state) =>
        env.useMock ? { user: state.user, status: state.status } : { user: state.user },
    },
  ),
);
