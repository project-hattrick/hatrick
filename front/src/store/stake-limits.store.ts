import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { StakePeriod, StakeLimitOutcome } from '@/enums/stake-period.enum';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;
/** Review window a limit *increase* (or removal) must wait out before it takes effect. */
export const LIMIT_INCREASE_REVIEW_MS = DAY_MS;

/** Minimal shape of a placed bet needed to total staked amounts in a window. */
export interface StakedEntry {
  stake: number;
  placedAt: number;
}

export interface PendingLimit {
  /** Target cap in coins; null = removing the limit entirely. */
  value: number | null;
  /** Epoch ms when the increase/removal takes effect. */
  effectiveAt: number;
}

export interface StakeLimit {
  /** Active cap in coins; null = no limit. */
  limit: number | null;
  /** Scheduled increase/removal awaiting its review window; null = none. */
  pending: PendingLimit | null;
}

const EMPTY: StakeLimit = { limit: null, pending: null };

interface StakeLimitsStore {
  daily: StakeLimit;
  weekly: StakeLimit;
  /** Set/adjust a period limit. Reductions & new caps are instant; increases schedule a 24h review. */
  setLimit: (period: StakePeriod, value: number | null) => StakeLimitOutcome;
  /** Cancel a scheduled (pending) increase/removal before it matures. */
  cancelPending: (period: StakePeriod) => void;
  /** Promote any pending change whose review window has elapsed (idempotent). */
  applyMatured: () => void;
}

/** null (no limit) compares as +Infinity so "raise/remove" vs "lower" is a plain numeric test. */
const cap = (value: number | null): number => (value === null ? Infinity : value);

/** Promote a pending change once its review window elapsed. Pure. */
export function resolveLimit(entry: StakeLimit, now: number): StakeLimit {
  if (entry.pending && now >= entry.pending.effectiveAt) {
    return { limit: entry.pending.value, pending: null };
  }
  return entry;
}

/** Active numeric cap for a period (null = unlimited), pending changes considered. */
export function effectiveLimit(entry: StakeLimit, now: number): number | null {
  return resolveLimit(entry, now).limit;
}

/** Total staked across entries placed at or after `since`. */
export function sumStakesSince(entries: StakedEntry[], since: number): number {
  return entries.reduce((total, e) => (e.placedAt >= since ? total + e.stake : total), 0);
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Daily/weekly stake limits (Responsible Gaming policy). A limit is enforced against the total
 * staked in a rolling window (see {@link sumStakesSince}). Lowering a limit or setting a first
 * cap is instant; *raising* or removing one is deferred by a 24h review window (stored as a
 * `pending` change that {@link applyMatured} promotes once elapsed). Persisted per browser.
 */
export const useStakeLimitsStore = create<StakeLimitsStore>()(
  persist(
    (set, get) => {
      const read = (period: StakePeriod) => (period === StakePeriod.Daily ? get().daily : get().weekly);
      const write = (period: StakePeriod, entry: StakeLimit) =>
        set(period === StakePeriod.Daily ? { daily: entry } : { weekly: entry });

      return {
        daily: EMPTY,
        weekly: EMPTY,
        setLimit: (period, value) => {
          const now = Date.now();
          const current = resolveLimit(read(period), now);
          const curCap = cap(current.limit);
          const nextCap = cap(value);

          if (nextCap === curCap) {
            // Same effective cap — just drop any stale pending change.
            write(period, { limit: current.limit, pending: null });
            return StakeLimitOutcome.Unchanged;
          }
          if (nextCap < curCap) {
            // Tightening (or a first cap) — effective immediately, clears any pending increase.
            write(period, { limit: value, pending: null });
            return StakeLimitOutcome.Applied;
          }
          // Loosening (raise or remove) — hold the current cap and schedule the change.
          write(period, { limit: current.limit, pending: { value, effectiveAt: now + LIMIT_INCREASE_REVIEW_MS } });
          return StakeLimitOutcome.Scheduled;
        },
        cancelPending: (period) => write(period, { limit: read(period).limit, pending: null }),
        applyMatured: () => {
          const now = Date.now();
          set((s) => ({ daily: resolveLimit(s.daily, now), weekly: resolveLimit(s.weekly, now) }));
        },
      };
    },
    {
      name: 'hat-trick-stake-limits',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
    },
  ),
);
