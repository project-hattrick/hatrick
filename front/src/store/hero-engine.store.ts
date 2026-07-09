import { create } from 'zustand';

/** Imperative controls the hero backdrop engine exposes to the surrounding HUD (timeline). */
export interface HeroEngineControls {
  restart: () => void;
  cycleSpeed: () => void;
}

interface HeroEngineStore {
  controls: HeroEngineControls | null;
  setControls: (controls: HeroEngineControls | null) => void;
  /** Bumped to force the backdrop to recreate the engine (a clean restart of the ambient match). */
  reloadKey: number;
  reload: () => void;
}

/**
 * The hero canvas (in the parallax stage) and its HUD (in the dashboard) live in separate React
 * subtrees, so they can't share a ref. The backdrop registers its engine controls here; the bottom
 * timeline reads them for speed and calls `reload()` to restart the match (a full recreate — the
 * persona sim's imperative `restart()` triggers undefined-frame draws, so we recreate instead).
 */
export const useHeroEngineStore = create<HeroEngineStore>((set) => ({
  controls: null,
  setControls: (controls) => set({ controls }),
  reloadKey: 0,
  reload: () => set((state) => ({ reloadKey: state.reloadKey + 1 })),
}));

export const useHeroControls = () => useHeroEngineStore((state) => state.controls);
