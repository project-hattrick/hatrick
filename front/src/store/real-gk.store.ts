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
  redCardActive: boolean;
  goalTeam: string;
  introActive: boolean;
  introStage: string;
  restartActive: boolean;
  restartLabel: string;
  restartTeam: string;
  redCardName: string;
  cardFlashSeq: number;
  cardFlashColor: string;
  cardFlashTeam: string;
  halfTimeActive: boolean;
  fullTimeActive: boolean;
  winnerTeam: string;
  teamBlueName: string;
  teamRedName: string;
  teamBlueFlag: string;
  teamRedFlag: string;
  cameraLabel: string;
  targetLabel: string;
  shotEffectLabel: string;
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
  redCardActive: false,
  goalTeam: '',
  introActive: false,
  introStage: '',
  restartActive: false,
  restartLabel: '',
  restartTeam: '',
  redCardName: '',
  cardFlashSeq: 0,
  cardFlashColor: '',
  cardFlashTeam: '',
  halfTimeActive: false,
  fullTimeActive: false,
  winnerTeam: '',
  teamBlueName: 'Blue',
  teamRedName: 'Red',
  teamBlueFlag: '',
  teamRedFlag: '',
  cameraLabel: 'Cam: Broadcast',
  targetLabel: 'Follow: ball',
  shotEffectLabel: 'Pixel Ring',
  uiHidden: false,
  apply: (patch) => set(patch),
  toggleUi: () => set((s) => ({ uiHidden: !s.uiHidden })),
}));

/**
 * True while a cinematic beat is playing (goal, replay or red card). The hero chrome dissolves during
 * these so the match takes the whole screen, then returns once the beat clears. Restart/intro banners
 * are intentionally excluded — they fire on every corner/throw-in and would make the chrome flicker.
 */
export const useHeroImpactActive = () =>
  useRealGkStore((s) => s.goalActive || s.replayActive || s.redCardActive);
