import { create } from 'zustand';

interface FantasyStore {
  squad: number[];
  setSquad: (ids: number[]) => void;
}

/** Fantasy squad selection. Base seam. */
export const useFantasyStore = create<FantasyStore>((set) => ({
  squad: [],
  setSquad: (squad) => set({ squad }),
}));
