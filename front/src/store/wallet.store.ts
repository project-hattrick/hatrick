import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WalletStore {
  /** Play-money coin balance shared across packs, market and bets (devnet · no real value). */
  balance: number;
  /** Remove coins (pack buy, market buy, bet stake). Never goes below zero. */
  debit: (amount: number) => void;
  /** Add coins (market sale, bet payout). */
  credit: (amount: number) => void;
  /** Adopt the authoritative server balance (from /auth/me) on sign-in. */
  hydrate: (balance: number) => void;
  /** Back to the guest seed on sign-out. */
  reset: () => void;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/** Starting play-money balance for a fresh wallet. */
const SEED_BALANCE = 28_105_820;

/** Single play-money ledger — the coin source for packs, the market and bets. Persisted. */
export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      balance: SEED_BALANCE,
      debit: (amount) => set((state) => ({ balance: Math.max(0, state.balance - Math.max(0, amount)) })),
      credit: (amount) => set((state) => ({ balance: state.balance + Math.max(0, amount) })),
      hydrate: (balance) => set({ balance: Math.max(0, Math.round(balance)) }),
      reset: () => set({ balance: SEED_BALANCE }),
    }),
    {
      name: 'hat-trick-wallet',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
    },
  ),
);

export const useBalance = () => useWalletStore((state) => state.balance);
