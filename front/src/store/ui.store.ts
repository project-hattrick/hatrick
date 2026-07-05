import { create } from 'zustand';
import { Dimension } from '@/enums/dimension.enum';
import { HeroLayout } from '@/enums/hero-layout.enum';
import { DEFAULT_BET_AMOUNT } from '@/config/matchmaking.config';
import type { PlayerProfile } from '@/config/duelists.config';

interface UiStore {
  dimension: Dimension;
  playing: boolean;
  heroLayout: HeroLayout;
  focusedPlayerIndex: number;
  /** ⌘K command-palette (user search) visibility. */
  searchOpen: boolean;
  /** When set, the matchmaking dialog opens as a direct challenge to this player. */
  challengeOpponent: PlayerProfile | null;
  /** Token stake picked for the next direct challenge (fantasy mode only). */
  challengeBet: number;
  setDimension: (dimension: Dimension) => void;
  togglePlaying: () => void;
  toggleHeroLayout: () => void;
  focusNext: () => void;
  focusPrev: () => void;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setChallengeBet: (amount: number) => void;
  openChallenge: (opponent: PlayerProfile) => void;
  closeChallenge: () => void;
}

/** Match-stage playback + live-hero UI state (replaces ad-hoc useState toggles). */
export const useUiStore = create<UiStore>((set) => ({
  dimension: Dimension.TwoFiveD,
  playing: true,
  heroLayout: HeroLayout.Immersive,
  focusedPlayerIndex: 0,
  searchOpen: false,
  challengeOpponent: null,
  challengeBet: DEFAULT_BET_AMOUNT,
  setDimension: (dimension) => set({ dimension }),
  togglePlaying: () => set((state) => ({ playing: !state.playing })),
  toggleHeroLayout: () =>
    set((state) => ({
      heroLayout: state.heroLayout === HeroLayout.Immersive ? HeroLayout.Split : HeroLayout.Immersive,
    })),
  focusNext: () => set((state) => ({ focusedPlayerIndex: state.focusedPlayerIndex + 1 })),
  focusPrev: () => set((state) => ({ focusedPlayerIndex: state.focusedPlayerIndex - 1 })),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),
  setChallengeBet: (challengeBet) => set({ challengeBet }),
  openChallenge: (challengeOpponent) => set({ challengeOpponent }),
  closeChallenge: () => set({ challengeOpponent: null }),
}));
