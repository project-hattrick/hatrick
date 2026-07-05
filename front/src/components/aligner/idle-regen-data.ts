/**
 * Data for the regen-v1 idle field sandbox (`/sandbox/personas-idle`).
 *
 * Uses the newly regenerated **body-only idle** pack (4 front frames) with each
 * persona's front head composited on top, dropped onto our real match court
 * (fullscreen) and sized like the outfield players we normally use.
 *
 * To add a character: drop `pNN_head_front.png` in `public/game/personas/heads/`
 * and append an entry to `PERSONAS`.
 */

const HEADS_ROOT = '/game/personas/heads';
const BODY_ROOT = '/game/personas/body-regen-v1';

/** Same v1 court the Real Match GK runtime paints (calibrated for field.ts metrics). */
export const COURT_BG = '/game/stadiums/rain-court/court.png';

/** The 4-frame front idle loop from the regen body pack. */
export const IDLE_FRAMES: string[] = [1, 2, 3, 4].map(
  (n) => `${BODY_ROOT}/idle_front_frame_0${n}.png`,
);

/** Loop cadence for the idle animation. */
export const IDLE_FRAME_MS = 380;

/**
 * Head compositing config for the front idle (matches how the regen body was tuned).
 * Same shape the real-gk render uses (`headScale`/`offsetXRatio`/`offsetYRatio`).
 */
export const IDLE_HEAD_CFG = { headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.095 } as const;

/**
 * Our usual outfield actor height band (screen px), from REAL_GK_V4/PLAY
 * (`spriteMinH` / `spriteMaxH`) — height lerps between them by pitch depth.
 */
export const SPRITE_MIN_H = 26;
export const SPRITE_MAX_H = 44;

export interface Persona {
  id: string;
  label: string;
  accent: string;
  head: string;
  /** Home position in field ratios: lat (0 = left touchline, 1 = right), depth (0 = far, 1 = near). */
  lat: number;
  depth: number;
}

const persona = (id: string, label: string, accent: string, lat: number, depth: number): Persona => ({
  id,
  label,
  accent,
  head: `${HEADS_ROOT}/${id}_head_front.png`,
  lat,
  depth,
});

/** The three characters placed around the center circle to read proportion + head fit on-pitch. */
export const PERSONAS: Persona[] = [
  persona('p01', 'P01 — base', '#f5d86f', 0.34, 0.52),
  persona('p02', 'P02', '#73d6ff', 0.5, 0.44),
  persona('p03', 'P03', '#7ef0c0', 0.66, 0.52),
];
