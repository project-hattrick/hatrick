import { pad2 } from '../util';

export const REAL_GK_ROOT = '/game/real-gk';

export const bodyFramePath = (name: string): string => `${REAL_GK_ROOT}/${name}`;
export const ballFramePath = (i: number): string => `${REAL_GK_ROOT}/ball/frame_${pad2(i)}.png`;

/** v2 reuses the v1 court as its background + area delimitation (per the design call). */
export const COURT_BG = '/game/stadiums/rain-court/court.png';

export const HEAD_PATHS = {
  front: `${REAL_GK_ROOT}/head_front.png`,
  frontClosed: `${REAL_GK_ROOT}/head_front_closed.png`,
  back: `${REAL_GK_ROOT}/head_back.png`,
  side: `${REAL_GK_ROOT}/head_side_right.png`,
} as const;

/** Referee v2 — whole sprites (head embedded), from the referee_control_tester. */
const REF_V2 = `${REAL_GK_ROOT}/referee-v2`;

export const REF_SPRITE_PATHS = {
  idleFront: `${REF_V2}/ref_idle_front.png`,
  idleQuarter: `${REF_V2}/ref_idle_34.png`,
  idleSide: `${REF_V2}/ref_idle_side.png`,
  redFront: `${REF_V2}/ref_red_front.png`,
  redQuarter: `${REF_V2}/ref_red_34.png`,
} as const;

export const REF_WALK_FRAMES = [1, 2, 3, 4].map((i) => `${REF_V2}/ref_walk_side_0${i}.png`);

/** Goal net rendered in depth layers (back behind players, front over them). */
export const GOAL_PATHS = {
  back: `${REAL_GK_ROOT}/goal/goal_back.png`,
  front: `${REAL_GK_ROOT}/goal/goal_front.png`,
  shadow: `${REAL_GK_ROOT}/goal/goal_shadow.png`,
} as const;

export const COACH_PATHS = {
  idle: `${REAL_GK_ROOT}/coach/coach_idle_side.png`,
  angry: `${REAL_GK_ROOT}/coach/coach_angry_side.png`,
} as const;

/**
 * Persona casting (`features.personaHeads`): headless outfield body frames + per-persona head sets, so a
 * real match can field distinct characters instead of one baked face. Bodies are the aligner's 2x2 sheets
 * sliced + trimmed per frame (see `public/game/personas/players/`); heads are the transparent busts.
 */
const PERSONAS_ROOT = '/game/personas';

/** How many persona head sets ship (p01..pNN in `public/game/personas/heads/`). */
export const PERSONA_COUNT = 3;

/** Headless outfield anims that carry a per-frame sliced body (BodyAnim value = file prefix). */
export const PERSONA_BODY_ANIMS = ['idle_front', 'walk_front', 'run_front', 'idle_back', 'walk_back', 'run_back', 'run_side'] as const;

export const personaBodyFrames = (anim: string): string[] =>
  [1, 2, 3, 4].map((n) => `${PERSONAS_ROOT}/players/${anim}_frame_0${n}.png`);

/** Per-persona head bust paths (front / back / side_right), pNN = 1-based. */
export const personaHeadPaths = (index: number): { front: string; back: string; side: string } => {
  const id = `p${String(index + 1).padStart(2, '0')}`;
  return {
    front: `${PERSONAS_ROOT}/heads/${id}_head_front.png`,
    back: `${PERSONAS_ROOT}/heads/${id}_head_back.png`,
    side: `${PERSONAS_ROOT}/heads/${id}_head_side_right.png`,
  };
};
