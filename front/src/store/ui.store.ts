import { create } from 'zustand';
import { Dimension } from '@/enums/dimension.enum';
import { HeroLayout } from '@/enums/hero-layout.enum';

interface UiStore {
  dimension: Dimension;
  playing: boolean;
  heroLayout: HeroLayout;
  focusedPlayerIndex: number;
  setDimension: (dimension: Dimension) => void;
  togglePlaying: () => void;
  toggleHeroLayout: () => void;
  focusNext: () => void;
  focusPrev: () => void;
}

/** Match-stage playback + live-hero UI state (replaces ad-hoc useState toggles). */
export const useUiStore = create<UiStore>((set) => ({
  dimension: Dimension.TwoFiveD,
  playing: true,
  heroLayout: HeroLayout.Immersive,
  focusedPlayerIndex: 0,
  setDimension: (dimension) => set({ dimension }),
  togglePlaying: () => set((state) => ({ playing: !state.playing })),
  toggleHeroLayout: () =>
    set((state) => ({
      heroLayout: state.heroLayout === HeroLayout.Immersive ? HeroLayout.Split : HeroLayout.Immersive,
    })),
  focusNext: () => set((state) => ({ focusedPlayerIndex: state.focusedPlayerIndex + 1 })),
  focusPrev: () => set((state) => ({ focusedPlayerIndex: state.focusedPlayerIndex - 1 })),
}));
