import { create } from 'zustand';
import { Dimension } from '@/enums/dimension.enum';
import { HeroLayout } from '@/enums/hero-layout.enum';
import { Theme, DEFAULT_THEME } from '@/enums/theme.enum';
import type { PlayerProfile } from '@/config/duelists.config';

interface UiStore {
  dimension: Dimension;
  playing: boolean;
  heroLayout: HeroLayout;
  theme: Theme;
  focusedPlayerIndex: number;
  /** ⌘K command-palette (user search) visibility. */
  searchOpen: boolean;
  /** When set, the matchmaking dialog opens as a direct challenge to this player. */
  challengeOpponent: PlayerProfile | null;
  setDimension: (dimension: Dimension) => void;
  togglePlaying: () => void;
  toggleHeroLayout: () => void;
  setTheme: (theme: Theme) => void;
  focusNext: () => void;
  focusPrev: () => void;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  openChallenge: (opponent: PlayerProfile) => void;
  closeChallenge: () => void;
}

/** Match-stage playback + live-hero UI state (replaces ad-hoc useState toggles). */
export const useUiStore = create<UiStore>((set) => ({
  dimension: Dimension.TwoFiveD,
  playing: true,
  heroLayout: HeroLayout.Immersive,
  theme: DEFAULT_THEME,
  focusedPlayerIndex: 0,
  searchOpen: false,
  challengeOpponent: null,
  setDimension: (dimension) => set({ dimension }),
  setTheme: (theme) => set({ theme }),
  togglePlaying: () => set((state) => ({ playing: !state.playing })),
  toggleHeroLayout: () =>
    set((state) => ({
      heroLayout: state.heroLayout === HeroLayout.Immersive ? HeroLayout.Split : HeroLayout.Immersive,
    })),
  focusNext: () => set((state) => ({ focusedPlayerIndex: state.focusedPlayerIndex + 1 })),
  focusPrev: () => set((state) => ({ focusedPlayerIndex: state.focusedPlayerIndex - 1 })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  openChallenge: (challengeOpponent) => set({ challengeOpponent }),
  closeChallenge: () => set({ challengeOpponent: null }),
}));
