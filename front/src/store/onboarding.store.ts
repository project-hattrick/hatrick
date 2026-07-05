import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OnboardingStore {
  /** True once the player has finished (or explicitly skipped) the first-login flow. */
  hasOnboarded: boolean;
  /** True after the persist layer rehydrates — the mount waits for this so it never flashes on load. */
  hydrated: boolean;
  /** Dev/test override — force the flow open regardless of the persisted flag (not persisted). */
  forcedOpen: boolean;
  /** Mark done and clear any forced-open override (the real first-login completion). */
  dismiss: () => void;
  setHydrated: () => void;
  /** Force the flow open (dev trigger button). */
  openOnboarding: () => void;
  /** Close a dev-forced open without marking onboarded, so the real login flow still fires. */
  closeForced: () => void;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * First-login onboarding flag, persisted so the welcome flow fires exactly once per browser.
 * The dialog opens when the user has a session (auth.store token) but hasn't onboarded yet,
 * or whenever `forcedOpen` is set by the dev trigger.
 */
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      hydrated: false,
      forcedOpen: false,
      dismiss: () => set({ hasOnboarded: true, forcedOpen: false }),
      setHydrated: () => set({ hydrated: true }),
      openOnboarding: () => set({ forcedOpen: true }),
      closeForced: () => set({ forcedOpen: false }),
    }),
    {
      name: 'hat-trick-onboarding',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
      partialize: (state) => ({ hasOnboarded: state.hasOnboarded }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
