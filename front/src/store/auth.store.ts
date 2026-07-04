import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthUser } from '@/services/auth.service';

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  /** True while the sign-in mutation is running (shared across UI). */
  authenticating: boolean;
  /** Last sign-in failure, so the login dialog can surface the headless driver's error. */
  error: string | null;
  setSession: (token: string, user: AuthUser) => void;
  setAuthenticating: (value: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/** Wallet session (JWT + user), persisted so a page reload keeps you signed in.
 *  `authenticating` is ephemeral (not persisted). */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      authenticating: false,
      error: null,
      setSession: (token, user) => set({ token, user, authenticating: false, error: null }),
      setAuthenticating: (authenticating) => set({ authenticating }),
      setError: (error) => set({ error }),
      clear: () => set({ token: null, user: null, authenticating: false, error: null }),
    }),
    {
      name: 'hat-trick-auth',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : localStorage,
      ),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
