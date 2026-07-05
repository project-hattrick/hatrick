/**
 * Data for the regen-v1 idle preview sandbox (`/sandbox/personas-idle`).
 *
 * Uses the newly regenerated **body-only idle** pack (4 front frames) with each
 * persona's front head composited on top per-frame, using the hand-tuned config
 * from the source playground (bodyScale / headScale / offset ratios per frame).
 * Ported into our stage + Neon Turf design and scaled to our in-game actor size.
 *
 * To add a character: drop `pNN_head_front.png` in `public/game/personas/heads/`
 * and append an entry to `PERSONAS`.
 */

const HEADS_ROOT = '/game/personas/heads';
const BODY_ROOT = '/game/personas/body-regen-v1';

export const IDLE_REGEN_STAGE_BG = '/game/personas/stadium_bg.png';

/** The 4-frame front idle loop from the regen body pack. */
export const IDLE_FRAMES: string[] = [1, 2, 3, 4].map(
  (n) => `${BODY_ROOT}/idle_front_frame_0${n}.png`,
);

/** Loop cadence for the idle animation. */
export const IDLE_FRAME_MS = 380;

/** Per-frame composition tuned in the source playground (matches the regen body). */
export interface FrameConfig {
  bodyScale: number;
  headScale: number;
  offsetXRatio: number;
  offsetYRatio: number;
}

export const IDLE_FRAME_CONFIG: FrameConfig[] = [
  { bodyScale: 0.7, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.09 },
  { bodyScale: 1, headScale: 0.48, offsetXRatio: 0.009, offsetYRatio: 0.097 },
  { bodyScale: 1, headScale: 0.48, offsetXRatio: -0.005, offsetYRatio: 0.094 },
  { bodyScale: 1, headScale: 0.48, offsetXRatio: -0.005, offsetYRatio: 0.097 },
];

export interface Persona {
  id: string;
  label: string;
  accent: string;
  head: string;
  /** Home position on the pitch, in stage %. */
  x: number;
  y: number;
}

const persona = (id: string, label: string, accent: string, x: number, y: number): Persona => ({
  id,
  label,
  accent,
  head: `${HEADS_ROOT}/${id}_head_front.png`,
  x,
  y,
});

/** The three characters placed in-frame to validate proportion + head fit. */
export const PERSONAS: Persona[] = [
  persona('p01', 'P01 — base', '#f5d86f', 32, 78),
  persona('p02', 'P02', '#73d6ff', 50, 71),
  persona('p03', 'P03', '#7ef0c0', 68, 78),
];
