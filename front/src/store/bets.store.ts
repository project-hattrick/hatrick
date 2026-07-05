import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { BetStatus } from '@/enums/bet-status.enum';
import { NotificationType } from '@/enums/notification-type.enum';
import type { Bet, BetSelection } from '@/types/bet';
import { BETTING_MATCH_LABEL } from '@/config/betting-markets.config';
import { MOCK_FIXTURE_ID } from '@/services/mock/live-feed.mock';
import { useWalletStore } from '@/store/wallet.store';
import { useNotificationsStore } from '@/store/notifications.store';

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
        const now = Date.now();
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
        const won = status === BetStatus.Won;
        useNotificationsStore.getState().push({
          type: NotificationType.Bet,
          title: won ? 'Bet won 🎉' : status === BetStatus.Lost ? 'Bet lost' : 'Bet voided',
          body: won ? `${bet.label} · +${payout.toLocaleString()} coins` : `${bet.label} · ${bet.matchLabel}`,
          href: '/bets',
        });
      },
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
