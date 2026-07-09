import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AgeGateStore {
  /** True once the user has confirmed they meet the 18+ minimum age. Persisted per browser. */
  confirmedAdult: boolean;
  /** Confirm 18+ and dismiss the gate for good. */
  confirm: () => void;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Age verification for the betting/prediction surfaces (18+ per the Responsible Gaming policy).
 * Only the positive confirmation is persisted — a user who answers "under 18" is soft-blocked
 * in-session (shown help resources) but can re-answer on reload, so nobody is permanently
 * locked out of a play-money devnet demo by a mis-click.
 */
export const useAgeGateStore = create<AgeGateStore>()(
  persist(
    (set) => ({
      confirmedAdult: false,
      confirm: () => set({ confirmedAdult: true }),
    }),
    {
      name: 'hat-trick-age-gate',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
    },
  ),
);
