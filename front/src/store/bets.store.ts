import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { BetStatus } from '@/enums/bet-status.enum';
import { NotificationType } from '@/enums/notification-type.enum';
import type { Bet, BetSelection } from '@/types/bet';
import { BETTING_MATCH_LABEL } from '@/config/betting-markets.config';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';
import { betService, type SettleStatus } from '@/services/bet.service';
import { isBackendSession } from '@/services/session-mode';
import { useWalletStore } from '@/store/wallet.store';
import { useNotificationsStore } from '@/store/notifications.store';
import { useResponsibleGamingStore } from '@/store/responsible-gaming.store';
import {
  useStakeLimitsStore,
  effectiveLimit,
  sumStakesSince,
  DAY_MS,
  WEEK_MS,
} from '@/store/stake-limits.store';

/** Random settlement delay so a placed bet resolves within a demo window. */
const MIN_SETTLE_MS = 6_000;
const MAX_SETTLE_MS = 12_000;

interface BetsStore {
  /** Current bet-slip selection (odds board → slip). */
  slip: BetSelection | null;
  stake: number;
  open: Bet[];
  settled: Bet[];
  select: (selection: BetSelection) => void;
  clearSlip: () => void;
  setStake: (stake: number) => void;
  /** Place the slip: debits the wallet and moves the bet to Open. */
  place: () => Bet | null;
  /** Resolve an open bet (mock settlement driver): credit the payout on a win. */
  settle: (id: string, status: BetStatus) => void;
  /** Replace the ledger with the authoritative server bets (on login). */
  hydrate: (open: Bet[], settled: Bet[]) => void;
  /** Clear the ledger on sign-out. */
  reset: () => void;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const DEFAULT_STAKE = 100;

/** Staked play-money bets: slip, open and settled. Persisted (progress survives reloads). */
export const useBetsStore = create<BetsStore>()(
  persist(
    (set, get) => ({
      slip: null,
      stake: DEFAULT_STAKE,
      open: [],
      settled: [],
      select: (slip) => set({ slip }),
      clearSlip: () => set({ slip: null }),
      setStake: (stake) => set({ stake: Math.max(0, Math.round(stake)) }),
      place: () => {
        const { slip, stake } = get();
        if (!slip || stake <= 0) return null;
        // Responsible-gaming gate: a self-excluded user cannot stake, even if the UI is bypassed.
        if (useResponsibleGamingStore.getState().excludedUntil !== null) return null;
        const now = Date.now();
        // Stake-limit gate (defensive): block if this stake would breach the active daily/weekly cap.
        const limits = useStakeLimitsStore.getState();
        limits.applyMatured();
        const ledger = [...get().open, ...get().settled];
        const dailyCap = effectiveLimit(limits.daily, now);
        const weeklyCap = effectiveLimit(limits.weekly, now);
        if (dailyCap !== null && sumStakesSince(ledger, now - DAY_MS) + stake > dailyCap) return null;
        if (weeklyCap !== null && sumStakesSince(ledger, now - WEEK_MS) + stake > weeklyCap) return null;
        const bet: Bet = {
          ...slip,
          id: crypto.randomUUID(),
          fixtureId: MOCK_FIXTURE_ID,
          matchLabel: BETTING_MATCH_LABEL,
          stake,
          status: BetStatus.Open,
          placedAt: now,
          settleAt: now + MIN_SETTLE_MS + Math.floor(Math.random() * (MAX_SETTLE_MS - MIN_SETTLE_MS)),
        };
        useWalletStore.getState().debit(stake);
        set((state) => ({ open: [bet, ...state.open], slip: null, stake: DEFAULT_STAKE }));
        // Persist to the server ledger (authed only); reconcile the wallet from the
        // authoritative balance and tag the open bet with its server id for settlement.
        if (isBackendSession()) {
          betService
            .place({ fixtureId: bet.fixtureId, market: bet.market, selection: bet.selectionId, stake, oddsTaken: bet.odds })
            .then((res) => {
              set((state) => ({
                open: state.open.map((b) => (b.id === bet.id ? { ...b, serverId: res.bet.id } : b)),
              }));
              useWalletStore.getState().hydrate(Number(res.balance));
            })
            .catch(() => {
              /* keep the optimistic local bet; the local debit already applied */
            });
        }
        return bet;
      },
      settle: (id, status) => {
        const bet = get().open.find((entry) => entry.id === id);
        if (!bet) return;
        const payout = Math.round(bet.stake * bet.odds);
        if (status === BetStatus.Won) useWalletStore.getState().credit(payout);
        if (status === BetStatus.Void) useWalletStore.getState().credit(bet.stake);
        set((state) => ({
          open: state.open.filter((entry) => entry.id !== id),
          settled: [{ ...bet, status }, ...state.settled].slice(0, 50),
        }));
        // Mirror the settlement to the server ledger and reconcile the balance.
        if (bet.serverId && isBackendSession()) {
          betService
            .settle(bet.serverId, status as SettleStatus)
            .then((res) => useWalletStore.getState().hydrate(Number(res.balance)))
            .catch(() => {
              /* local settlement already applied; server will reconcile on next /auth/me */
            });
        }
        const won = status === BetStatus.Won;
        useNotificationsStore.getState().push({
          type: NotificationType.Bet,
          title: won ? 'Bet won 🎉' : status === BetStatus.Lost ? 'Bet lost' : 'Bet voided',
          body: won ? `${bet.label} · +${payout.toLocaleString()} coins` : `${bet.label} · ${bet.matchLabel}`,
          href: '/bets',
        });
      },
      hydrate: (open, settled) => set({ open, settled }),
      reset: () => set({ open: [], settled: [], slip: null, stake: DEFAULT_STAKE }),
    }),
    {
      name: 'hat-trick-bets',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
      partialize: (state) => ({ open: state.open, settled: state.settled, stake: state.stake }),
    },
  ),
);

export const useBetSlip = () => useBetsStore((state) => state.slip);
export const useOpenBets = () => useBetsStore((state) => state.open);
export const useSettledBets = () => useBetsStore((state) => state.settled);
