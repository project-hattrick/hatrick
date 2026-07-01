import { create } from 'zustand';
import type { HudPatch } from '@/game/core/types';

interface SandboxStore {
  scoreBlue: number;
  scoreRed: number;
  clock: string;
  eventText: string;
  paused: boolean;
  speed: number;
  cameraLabel: string;
  targetLabel: string;
  rainLabel: string;
  goalActive: boolean;
  apply: (patch: HudPatch) => void;
}

/** HUD mirror of the imperative engine. The engine pushes patches only when a value changes. */
export const useSandboxStore = create<SandboxStore>((set) => ({
  scoreBlue: 0,
  scoreRed: 0,
  clock: '00:00',
  eventText: '',
  paused: false,
  speed: 1,
  cameraLabel: 'CAMERA x2.3',
  targetLabel: 'TARGET: BALL',
  rainLabel: 'STRONG',
  goalActive: false,
  apply: (patch) => set(patch),
}));
