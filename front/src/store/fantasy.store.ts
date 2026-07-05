import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PackCard } from '@/config/pack-pool.config';

interface FantasyStore {
  squad: number[];
  /** Cards the player owns — seeded by the onboarding welcome pack, grown by store purchases. */
  collection: PackCard[];
  setSquad: (ids: number[]) => void;
  /** Merge freshly pulled cards into the collection, de-duped by name. */
  addToCollection: (cards: PackCard[]) => void;
}

/** No-op storage on the server so persist doesn't touch localStorage during SSR. */
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/** Fantasy squad selection + owned card collection. Persisted so progress survives reloads. */
export const useFantasyStore = create<FantasyStore>()(
  persist(
    (set) => ({
      squad: [],
      collection: [],
      setSquad: (squad) => set({ squad }),
      addToCollection: (cards) =>
        set((state) => {
          const owned = new Set(state.collection.map((card) => card.name));
          const fresh = cards.filter((card) => !owned.has(card.name));
          return fresh.length ? { collection: [...state.collection, ...fresh] } : state;
        }),
    }),
    {
      name: 'hat-trick-fantasy',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
      partialize: (state) => ({ squad: state.squad, collection: state.collection }),
    },
  ),
);
