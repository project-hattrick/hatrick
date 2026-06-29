import { create } from 'zustand';

export interface Balloon {
  id: string;
  text: string;
}

interface CrowdStore {
  balloons: Balloon[];
  push: (balloon: Balloon) => void;
}

/** Crowd speech-balloons over the stands. Base seam. */
export const useCrowdStore = create<CrowdStore>((set) => ({
  balloons: [],
  push: (balloon) => set((state) => ({ balloons: [...state.balloons, balloon].slice(-30) })),
}));
