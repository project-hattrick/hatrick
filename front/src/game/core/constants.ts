/** Stable tunables ported from game_chuva.html. Data, not magic strings sprinkled in logic. */

export const CANVAS = { width: 1675, height: 941 } as const;

/** Logical pitch space the simulation runs in (FW x FH in the original). */
export const FIELD = { width: 620, height: 380 } as const;

/** Player sprite base scale (multiplied by the perspective scale per draw). */
export const PLAYER_SCALE = 0.42;

/** Locomotion stride: phase units per walk/run frame. */
export const STRIDE = 3.6;

/** Fixed-timestep loop. */
export const LOOP_STEP = 1000 / 60;
export const MAX_SUBSTEPS = 5;

const FW = FIELD.width;
const FH = FIELD.height;

const GOAL_WIDTH = 0.16 * FH;
const AREA_DEPTH = 0.13 * FW;
const AREA_WIDTH = 0.46 * FH;

/** Goal mouth (scores a goal) + penalty box (keeper zone), in logical pitch units. */
export const PITCH = {
  goalWidth: GOAL_WIDTH,
  goalY0: (FH - GOAL_WIDTH) / 2,
  goalY1: (FH + GOAL_WIDTH) / 2,
  areaDepth: AREA_DEPTH,
  areaY0: (FH - AREA_WIDTH) / 2,
  areaY1: (FH + AREA_WIDTH) / 2,
} as const;

/** Goal-celebration freeze + scheduling (ticks). */
export const GOAL_PAUSE = 80;
export const KICKOFF_DELAY = 48;
export const CELEBRATE_TICKS = 80;
