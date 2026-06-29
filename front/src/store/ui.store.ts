import { create } from 'zustand';
import { Dimension } from '@/enums/dimension.enum';

interface UiStore {
  dimension: Dimension;
  muted: boolean;
  playing: boolean;
  setDimension: (dimension: Dimension) => void;
  toggleMuted: () => void;
  togglePlaying: () => void;
}

/** Match-stage playback UI state (replaces ad-hoc useState toggles). */
export const useUiStore = create<UiStore>((set) => ({
  dimension: Dimension.TwoD,
  muted: false,
  playing: true,
  setDimension: (dimension) => set({ dimension }),
  toggleMuted: () => set((state) => ({ muted: !state.muted })),
  togglePlaying: () => set((state) => ({ playing: !state.playing })),
}));
