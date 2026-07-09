import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CookieNoticeStore {
  /** Whether the user has seen and dismissed the essential-cookies notice. */
  acknowledged: boolean;
  /** Dismiss the notice for good (persisted per browser). */
  acknowledge: () => void;
  /** Bring the notice back (the "show again" control in Settings). */
  reset: () => void;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Tracks dismissal of the essential-cookies notice. We only ship strictly-necessary
 * (auth session) and functional (UI state) storage — no tracking — so this is an
 * informational one-time notice, not a consent gate. Persisted so it never nags twice.
 */
export const useCookieNoticeStore = create<CookieNoticeStore>()(
  persist(
    (set) => ({
      acknowledged: false,
      acknowledge: () => set({ acknowledged: true }),
      reset: () => set({ acknowledged: false }),
    }),
    {
      name: 'hat-trick-cookie-notice',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
    },
  ),
);
