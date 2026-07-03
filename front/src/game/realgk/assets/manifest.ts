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
