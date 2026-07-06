import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CollectionCard } from '@/services/fantasy.service';

/** Default formation shape when none is saved yet. */
const DEFAULT_FORMATION = '4-3-3';

interface HydratePayload {
  collection: CollectionCard[];
  squad: number[];
  formation: string;
}

interface FantasyStore {
  squad: number[];
  formation: string;
  /** Cards the player owns — seeded by the welcome pack, grown by store purchases. */
  collection: CollectionCard[];
  setSquad: (ids: number[]) => void;
  setFormation: (formation: string) => void;
  /** Merge freshly pulled cards into the collection, de-duped by name. */
  addToCollection: (cards: CollectionCard[]) => void;
  /** Remove a card by name (market sale). */
  removeFromCollection: (name: string) => void;
  /** Replace local state with the authoritative server snapshot (on login). */
  hydrate: (payload: HydratePayload) => void;
  /** Back to a clean slate on sign-out. */
  reset: () => void;
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
      formation: DEFAULT_FORMATION,
      collection: [],
      setSquad: (squad) => set({ squad }),
      setFormation: (formation) => set({ formation }),
      addToCollection: (cards) =>
        set((state) => {
          const owned = new Set(state.collection.map((card) => card.name));
          const fresh = cards.filter((card) => !owned.has(card.name));
          return fresh.length ? { collection: [...state.collection, ...fresh] } : state;
        }),
      removeFromCollection: (name) =>
        set((state) => ({ collection: state.collection.filter((card) => card.name !== name) })),
      hydrate: ({ collection, squad, formation }) => set({ collection, squad, formation }),
      reset: () => set({ collection: [], squad: [], formation: DEFAULT_FORMATION }),
    }),
    {
      name: 'hat-trick-fantasy',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
      partialize: (state) => ({ squad: state.squad, collection: state.collection, formation: state.formation }),
    },
  ),
);
