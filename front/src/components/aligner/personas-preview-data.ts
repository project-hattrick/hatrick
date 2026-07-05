/**
 * Data for the in-game persona preview sandbox (`/sandbox/personas`).
 * Same approved body pack for everyone, per-persona head family composited on top —
 * a quick read of whether each character sits well in front / back / profile at the
 * shared head scale, without any other game system masking it.
 *
 * To add a new character: drop `pNN_head_{front,back,side_right}.png` in
 * `public/game/personas/heads/` and append one entry to `PERSONAS`. Everything scales.
 */

const HEADS_ROOT = '/game/personas/heads';
const BODY_ROOT = '/game/personas/body';

export const PERSONAS_STAGE_BG = '/game/personas/stadium_bg.png';

/** Which head view a body mode composites with. */
export enum HeadFace {
  Front = 'front',
  Back = 'back',
  Side = 'side',
}

export interface BodyMode {
  id: string;
  label: string;
  fps: number;
  frames: string[];
  face: HeadFace;
  moving: boolean;
}

const frames = (mode: string): string[] =>
  [1, 2, 3, 4].map((n) => `${BODY_ROOT}/${mode}_frame_0${n}.png`);

/** Body animation modes, keyed by id — the control buttons cycle these. */
export const BODY_MODES: Record<string, BodyMode> = {
  idle_front: { id: 'idle_front', label: 'Idle front', fps: 2.2, frames: frames('idle_front'), face: HeadFace.Front, moving: false },
  walk_front: { id: 'walk_front', label: 'Walk front', fps: 4.8, frames: frames('walk_front'), face: HeadFace.Front, moving: true },
  walk_back: { id: 'walk_back', label: 'Walk back', fps: 4.8, frames: frames('walk_back'), face: HeadFace.Back, moving: true },
  run_side: { id: 'run_side', label: 'Run profile', fps: 7.2, frames: frames('run_side'), face: HeadFace.Side, moving: true },
};

export const AUTO_MODE = 'auto';

/** Per-face composition: how big the head reads and where it overlaps the body. */
export const FACE_CONFIG: Record<HeadFace, { headScale: number; offsetXRatio: number; offsetYRatio: number }> = {
  [HeadFace.Front]: { headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
  [HeadFace.Back]: { headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.08 },
  [HeadFace.Side]: { headScale: 0.42, offsetXRatio: 0.18, offsetYRatio: 0.055 },
};

export interface Persona {
  id: string;
  label: string;
  accent: string;
  heads: Record<HeadFace, string>;
}

const persona = (id: string, label: string, accent: string): Persona => ({
  id,
  label,
  accent,
  heads: {
    [HeadFace.Front]: `${HEADS_ROOT}/${id}_head_front.png`,
    [HeadFace.Back]: `${HEADS_ROOT}/${id}_head_back.png`,
    [HeadFace.Side]: `${HEADS_ROOT}/${id}_head_side_right.png`,
  },
});

/** The roster shown in the preview. Grows as new heads land. */
export const PERSONAS: Persona[] = [
  persona('p01', 'P01 — base', '#f5d86f'),
  persona('p02', 'P02', '#73d6ff'),
  persona('p03', 'P03', '#7ef0c0'),
];
