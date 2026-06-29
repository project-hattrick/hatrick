import { create } from 'zustand';

export interface MatchEvent {
  fixtureId: number;
  action: string;
  state: string;
  ts: number;
}

interface MatchStore {
  fixtureId: number | null;
  events: MatchEvent[];
  setFixture: (id: number | null) => void;
  pushEvent: (event: MatchEvent) => void;
}

/** Live match state fed by the realtime socket. Base seam. */
export const useMatchStore = create<MatchStore>((set) => ({
  fixtureId: null,
  events: [],
  setFixture: (fixtureId) => set({ fixtureId }),
  pushEvent: (event) => set((state) => ({ events: [...state.events, event].slice(-100) })),
}));
