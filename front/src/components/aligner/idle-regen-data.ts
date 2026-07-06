/**
 * Data for the regen-v1 body sandbox (`/sandbox/personas-idle`).
 *
 * Uses the newly regenerated **body-only** packs (idle / walk / run / shot front + run side, 4 frames each)
 * with each persona's head composited on top, dropped onto our real match court (fullscreen) and sized like
 * the outfield players we normally use. Flip between anims with the mode selector to read proportion + head
 * fit for every locomotion the persona bodies ship with.
 *
 * To add a character: drop `pNN_head_front.png` (+ `_head_side_right.png`) in `public/game/personas/heads/`
 * and append an entry to `PERSONAS`.
 */

const HEADS_ROOT = '/game/personas/heads';
const BODY_ROOT = '/game/personas/body-regen-v1';

/** Same v1 court the Real Match GK runtime paints (calibrated for field.ts metrics). */
export const COURT_BG = '/game/stadiums/rain-court/court.png';

const frames = (prefix: string, n = 4): string[] =>
  Array.from({ length: n }, (_, i) => `${BODY_ROOT}/${prefix}_frame_0${i + 1}.png`);

/** Which head bust an anim composites (front, side_right for the profile run, or back for away-facing). */
export type HeadView = 'front' | 'side' | 'back';

export interface AnimDef {
  id: string;
  label: string;
  /** The 4 body-only frames for this anim. */
  frames: string[];
  /** Loop cadence (ms per frame). */
  frameMs: number;
  headView: HeadView;
  /** Head compositing config (same shape the real-gk render uses). */
  headCfg: { headScale: number; offsetXRatio: number; offsetYRatio: number };
}

/** Front head placement shared by the front-facing regen bodies (tuned with the idle pack). */
const FRONT_HEAD = { headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.095 } as const;
/** Side head placement for the profile run (seats the side bust over the shoulder). */
const SIDE_HEAD = { headScale: 0.62, offsetXRatio: 0.11, offsetYRatio: 0.09 } as const;
/** Back head placement for the away-facing bodies (from the updated preview's BACK_CONFIG). */
const BACK_HEAD = { headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.08 } as const;
/** Front head placement for the knee-celebration bodies (representative of the preview's KNEE_CONFIG). */
const KNEE_HEAD = { headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.138 } as const;
/** Side head placement for the slide tackle (carrinho, regen v1) — from the pack's approved config. */
const SLIDE_HEAD = { headScale: 0.56, offsetXRatio: 0.1, offsetYRatio: 0.1 } as const;

/** Every regen body-only anim, in selector order. Front anims share FRONT_HEAD; side/back use their bust. */
export const ANIMS: AnimDef[] = [
  { id: 'idle', label: 'Idle', frames: frames('idle_front'), frameMs: 380, headView: 'front', headCfg: FRONT_HEAD },
  { id: 'walk', label: 'Walk', frames: frames('walk_front'), frameMs: 210, headView: 'front', headCfg: FRONT_HEAD },
  { id: 'run', label: 'Run', frames: frames('run_front'), frameMs: 150, headView: 'front', headCfg: FRONT_HEAD },
  { id: 'shot', label: 'Shot', frames: frames('shot_front'), frameMs: 170, headView: 'front', headCfg: FRONT_HEAD },
  { id: 'shot_back', label: 'Shot · back', frames: frames('shot_back'), frameMs: 170, headView: 'back', headCfg: BACK_HEAD },
  { id: 'side', label: 'Run · side', frames: frames('run_side'), frameMs: 150, headView: 'side', headCfg: SIDE_HEAD },
  { id: 'slide', label: 'Slide (carrinho)', frames: frames('slide_tackle', 6), frameMs: 130, headView: 'side', headCfg: SLIDE_HEAD },
  { id: 'idle_back', label: 'Idle · back', frames: frames('idle_back'), frameMs: 380, headView: 'back', headCfg: BACK_HEAD },
  { id: 'walk_back', label: 'Walk · back', frames: frames('walk_back'), frameMs: 210, headView: 'back', headCfg: BACK_HEAD },
  { id: 'run_back', label: 'Run · back', frames: frames('run_back'), frameMs: 150, headView: 'back', headCfg: BACK_HEAD },
  { id: 'knee_slide', label: 'Knee slide', frames: frames('celebrate_knee_slide', 6), frameMs: 140, headView: 'front', headCfg: KNEE_HEAD },
  { id: 'knee_rise', label: 'Knee rise', frames: frames('celebrate_knee_rise', 3), frameMs: 180, headView: 'front', headCfg: KNEE_HEAD },
  { id: 'knee_jump', label: 'Knee jump', frames: frames('celebrate_knee_jump', 4), frameMs: 150, headView: 'front', headCfg: KNEE_HEAD },
];

/** Flat list of every frame src (for preloading). */
export const ALL_FRAMES: string[] = ANIMS.flatMap((a) => a.frames);

/**
 * Our usual outfield actor height band (screen px), from REAL_GK_V4/PLAY
 * (`spriteMinH` / `spriteMaxH`) — height lerps between them by pitch depth.
 */
export const SPRITE_MIN_H = 20;
export const SPRITE_MAX_H = 34;

export interface Persona {
  id: string;
  label: string;
  accent: string;
  /** Front + side + back head busts (picked per anim's headView). */
  headFront: string;
  headSide: string;
  headBack: string;
  /** Home position in field ratios: lat (0 = left touchline, 1 = right), depth (0 = far, 1 = near). */
  lat: number;
  depth: number;
}

const persona = (id: string, label: string, accent: string, lat: number, depth: number): Persona => ({
  id,
  label,
  accent,
  headFront: `${HEADS_ROOT}/${id}_head_front.png`,
  headSide: `${HEADS_ROOT}/${id}_head_side_right.png`,
  headBack: `${HEADS_ROOT}/${id}_head_back.png`,
  lat,
  depth,
});

/** The three characters placed around the center circle to read proportion + head fit on-pitch. */
export const PERSONAS: Persona[] = [
  persona('p01', 'P01 — base', '#f5d86f', 0.34, 0.52),
  persona('p02', 'P02', '#73d6ff', 0.5, 0.44),
  persona('p03', 'P03', '#7ef0c0', 0.66, 0.52),
];
