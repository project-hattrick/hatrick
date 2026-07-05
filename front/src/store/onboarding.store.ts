import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OnboardingStore {
  /** True once the player has finished (or explicitly skipped) the first-login flow. */
  hasOnboarded: boolean;
  /** True after the persist layer rehydrates — the mount waits for this so it never flashes on load. */
  hydrated: boolean;
  completeOnboarding: () => void;
  setHydrated: () => void;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * First-login onboarding flag, persisted so the welcome flow fires exactly once per browser.
 * The dialog opens when the user has a session (auth.store token) but hasn't onboarded yet.
 */
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      hydrated: false,
      completeOnboarding: () => set({ hasOnboarded: true }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'hat-trick-onboarding',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
      partialize: (state) => ({ hasOnboarded: state.hasOnboarded }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
