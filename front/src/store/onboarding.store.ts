import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OnboardingStore {
  /**
   * Wallets queued to see the first-login flow (registered/new, not yet finished).
   * Persisted so a mid-flow reload resumes onboarding, and so it is tracked PER account
   * instead of a single browser-global flag (which stuck `true` after the first sign-in).
   */
  pending: string[];
  /** Dev/test override — force the flow open regardless of `pending` (not persisted). */
  forcedOpen: boolean;
  /** New account signed in — queue onboarding for this wallet (called on `isNew` verify). */
  begin: (wallet: string) => void;
  /** Finished (or explicitly skipped) — clear this wallet's onboarding and any dev override. */
  complete: (wallet: string | null) => void;
  /** Force the flow open (dev trigger button). */
  openOnboarding: () => void;
  /** Close a dev-forced open without touching `pending`, so the real login flow still fires. */
  closeForced: () => void;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * First-login onboarding queue, keyed by wallet and persisted. A wallet is added on a
 * fresh registration (backend `isNew`) and removed once the flow completes — so onboarding
 * fires for every NEW account (register) but never for a returning login, regardless of how
 * many accounts have already onboarded in this browser. localStorage rehydration is
 * synchronous, so `pending` is already correct on the first render — no hydration gate needed.
 */
export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      pending: [],
      forcedOpen: false,
      begin: (wallet) =>
        set((s) => (s.pending.includes(wallet) ? s : { pending: [...s.pending, wallet] })),
      complete: (wallet) =>
        set((s) => ({ pending: s.pending.filter((w) => w !== wallet), forcedOpen: false })),
      openOnboarding: () => set({ forcedOpen: true }),
      closeForced: () => set({ forcedOpen: false }),
    }),
    {
      name: 'hat-trick-onboarding',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
      partialize: (state) => ({ pending: state.pending }),
    },
  ),
);
