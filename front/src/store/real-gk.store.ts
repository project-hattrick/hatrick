import { create } from 'zustand';
import type { RealGkHudPatch } from '@/game/realgk/types';

interface RealGkStore {
  scoreBlue: number;
  scoreRed: number;
  clock: string;
  phase: string;
  statusTitle: string;
  statusText: string;
  ballText: string;
  paused: boolean;
  speed: number;
  refereeActive: boolean;
  goalActive: boolean;
  replayActive: boolean;
  cameraLabel: string;
  targetLabel: string;
  uiHidden: boolean;
  apply: (patch: RealGkHudPatch) => void;
  toggleUi: () => void;
}

/** HUD mirror for the Real Match Sim GK runtime (v2). Engine pushes patches on change. */
export const useRealGkStore = create<RealGkStore>((set) => ({
  scoreBlue: 0,
  scoreRed: 0,
  clock: '00:00',
  phase: 'First half',
  statusTitle: 'Kickoff',
  statusText: '',
  ballText: 'ball loose',
  paused: false,
  speed: 1,
  refereeActive: true,
  goalActive: false,
  replayActive: false,
  cameraLabel: 'Cam: Broadcast',
  targetLabel: 'Follow: ball',
  uiHidden: false,
  apply: (patch) => set(patch),
  toggleUi: () => set((s) => ({ uiHidden: !s.uiHidden })),
}));
