import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PackCard } from '@/config/pack-pool.config';
import { SEED_LISTINGS, type Listing } from '@/config/market-listings.config';
import { marketService } from '@/services/market.service';
import { useAuthStore } from '@/store/auth.store';
import { useWalletStore } from '@/store/wallet.store';
import { useFantasyStore } from '@/store/fantasy.store';

/** Authed users persist trades to the backend ledger; guests stay purely local. */
const isAuthed = () => useAuthStore.getState().status === 'authed';

interface MarketStore {
  listings: Listing[];
  /** Buy a listing: debit the wallet, add the card to the collection, remove the listing. */
  buy: (id: string) => boolean;
  /** Sell an owned card at a chosen price: credit the wallet, remove it, relist it on the market. */
  sell: (card: PackCard, price: number) => void;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

let saleCounter = 0;

/** Internal player market — client-only mock. Buys/sells move coins and the collection. Persisted. */
export const useMarketStore = create<MarketStore>()(
  persist(
    (set, get) => ({
      listings: SEED_LISTINGS,
      buy: (id) => {
        const listing = get().listings.find((entry) => entry.id === id);
        if (!listing) return false;
        if (useWalletStore.getState().balance < listing.price) return false;
        useWalletStore.getState().debit(listing.price);
        useFantasyStore.getState().addToCollection([listing.card]);
        set((state) => ({ listings: state.listings.filter((entry) => entry.id !== id) }));
        // Persist the coin movement to the server ledger (authed only) + reconcile balance.
        if (isAuthed()) {
          marketService
            .buy(listing.card.name, listing.price)
            .then((res) => useWalletStore.getState().hydrate(Number(res.balance)))
            .catch(() => {
              /* keep the optimistic local trade; the local debit already applied */
            });
        }
        return true;
      },
      sell: (card, price) => {
        useWalletStore.getState().credit(price);
        useFantasyStore.getState().removeFromCollection(card.name);
        saleCounter += 1;
        set((state) => ({ listings: [{ id: `sale-${saleCounter}-${card.name}`, card, price }, ...state.listings] }));
        if (isAuthed()) {
          marketService
            .sell(card.name, price)
            .then((res) => useWalletStore.getState().hydrate(Number(res.balance)))
            .catch(() => {
              /* keep the optimistic local trade; the local credit already applied */
            });
        }
      },
    }),
    {
      name: 'hat-trick-market',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
    },
  ),
);

export const useListings = () => useMarketStore((state) => state.listings);
