/** Data for the in-app player head aligner (headless body 2x2 sheets + separate heads). */

export const PLAYER_ALIGN_ROOT = '/game/player-align';

/** Base visible height in px — mirrors the hero player near-size (realgk SPRITE_MAX_H). */
export const BASE_VISIBLE_HEIGHT = 58;

export const STORAGE_KEY = 'player-head-aligner-v1';

export interface FrameCfg {
  headView: string;
  bodyScale: number;
  headScale: number;
  offsetXRatio: number;
  offsetYRatio: number;
}

export interface HeadOption {
  id: string;
  label: string;
}

export const HEAD_OPTIONS: HeadOption[] = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'side_right', label: 'Side Right' },
  { id: 'side_left', label: 'Side Left' },
];

export interface PlayerAnim {
  id: string;
  title: string;
  body: string;
  frameCount: number;
  defaults: FrameCfg;
}

const front = (): FrameCfg => ({ headView: 'front', bodyScale: 1, headScale: 0.5, offsetXRatio: 0, offsetYRatio: 0.12 });
const back = (): FrameCfg => ({ headView: 'back', bodyScale: 1, headScale: 0.5, offsetXRatio: 0, offsetYRatio: 0.1 });
const side = (): FrameCfg => ({ headView: 'side_right', bodyScale: 1, headScale: 0.5, offsetXRatio: 0.1, offsetYRatio: 0.1 });

/** 2x2 sheets → 4 frames each. Ids mirror the game body animations. */
export const PLAYER_ANIMS: PlayerAnim[] = [
  { id: 'idle_front', title: 'Idle Front', body: 'idle_front', frameCount: 4, defaults: front() },
  { id: 'walk_front', title: 'Walk Front', body: 'walk_front', frameCount: 4, defaults: front() },
  { id: 'run_front', title: 'Run Front', body: 'run_front', frameCount: 4, defaults: front() },
  { id: 'idle_back', title: 'Idle Back', body: 'idle_back', frameCount: 4, defaults: back() },
  { id: 'walk_back', title: 'Walk Back', body: 'walk_back', frameCount: 4, defaults: back() },
  { id: 'run_back', title: 'Run Back', body: 'run_back', frameCount: 4, defaults: back() },
  { id: 'run_side', title: 'Run Side', body: 'run_side', frameCount: 4, defaults: side() },
];

export const bodyPath = (body: string): string => `${PLAYER_ALIGN_ROOT}/bodies/${body}.png`;
export const headPath = (view: string): string => `${PLAYER_ALIGN_ROOT}/heads/${view}.png`;

export type Bbox = [number, number, number, number];
export type AlignConfig = Record<string, FrameCfg[]>;

export const freshConfig = (): AlignConfig =>
  Object.fromEntries(PLAYER_ANIMS.map((a) => [a.id, Array.from({ length: a.frameCount }, () => ({ ...a.defaults }))]));
