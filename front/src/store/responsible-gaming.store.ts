import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SelfExclusionStatus } from '@/enums/self-exclusion-status.enum';

/** Minimum self-exclusion duration per the Responsible Gaming policy (24 hours). */
export const MIN_EXCLUSION_MS = 24 * 60 * 60 * 1000;

interface ResponsibleGamingStore {
  /** Epoch ms until which betting is locked; null = never self-excluded. */
  excludedUntil: number | null;
  /** Self-exclude from betting for at least 24h — effective immediately. */
  exclude: () => void;
  /** Reactivate after the cooling-off period; returns false (no-op) while still locked. */
  reactivate: () => boolean;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Self-exclusion from the staked betting surfaces (Responsible Gaming policy). Effective
 * immediately, minimum 24h, and stays in force until the user actively reactivates after a
 * cooling-off confirmation — so the betting gate is simply `excludedUntil !== null`, not a
 * time comparison. Persisted per browser like the other stores.
 */
export const useResponsibleGamingStore = create<ResponsibleGamingStore>()(
  persist(
    (set, get) => ({
      excludedUntil: null,
      exclude: () => set({ excludedUntil: Date.now() + MIN_EXCLUSION_MS }),
      reactivate: () => {
        const { excludedUntil } = get();
        if (excludedUntil !== null && Date.now() < excludedUntil) return false;
        set({ excludedUntil: null });
        return true;
      },
    }),
    {
      name: 'hat-trick-responsible-gaming',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
    },
  ),
);

/** True while betting must be blocked — self-excluded and not yet reactivated. */
export function isSelfExcluded(excludedUntil: number | null): boolean {
  return excludedUntil !== null;
}

/** Tri-state status for the UI, given the stored deadline and the current time. */
export function selfExclusionStatus(excludedUntil: number | null, now: number): SelfExclusionStatus {
  if (excludedUntil === null) return SelfExclusionStatus.Active;
  return now < excludedUntil ? SelfExclusionStatus.Excluded : SelfExclusionStatus.CoolingOff;
}
