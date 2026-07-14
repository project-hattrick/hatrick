import { create } from 'zustand';

/**
 * Lightweight store for navigation intents that originate outside React
 * (e.g. socket event handlers). A NavConsumer component mounted app-wide
 * watches this and calls router.push when a destination appears.
 */
interface PendingNavStore {
  destination: string | null;
  navigate: (destination: string) => void;
  consume: () => void;
}

export const usePendingNavStore = create<PendingNavStore>((set) => ({
  destination: null,
  navigate: (destination) => set({ destination }),
  consume: () => set({ destination: null }),
}));
