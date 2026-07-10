import { create } from 'zustand';

/** Imperative controls the hero backdrop engine exposes to the surrounding HUD (timeline). */
export interface HeroEngineControls {
  restart: () => void;
  cycleSpeed: () => void;
}

interface HeroEngineStore {
  controls: HeroEngineControls | null;
  setControls: (controls: HeroEngineControls | null) => void;
}

/**
 * The hero canvas (in the parallax stage) and its HUD (in the dashboard) live in separate React
 * subtrees, so they can't share a ref. The backdrop registers its engine controls here; the bottom
 * timeline reads them for the ambient (non-replay) restart/speed fallbacks.
 */
export const useHeroEngineStore = create<HeroEngineStore>((set) => ({
  controls: null,
  setControls: (controls) => set({ controls }),
}));

export const useHeroControls = () => useHeroEngineStore((state) => state.controls);
