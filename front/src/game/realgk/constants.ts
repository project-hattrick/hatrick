/** Stable tunables ported from index_referee_spawn_clean.html. */

export const BALL_FRAME_COUNT = 20;

/** Match-clock acceleration (state.time += dt * TIME_SCALE). */
export const TIME_SCALE = 4.4;

/** Perspective sprite height range from far (top) to near (bottom) of the pitch. */
export const SPRITE_MIN_H = 35;
export const SPRITE_MAX_H = 58;

/** Referee (v2 whole sprites) size relative to a player. */
export const REFEREE_SCALE = 0.9;

/**
 * 2D (flat) render tuning. In flat mode the depth cue is dropped: every entity is sized as if it
 * sat at FLAT_DEPTH (constant size, no growing toward the camera) and the whole scene is squashed
 * vertically by FLAT_SQUASH so the trapezoid pitch reads shallower/straighter. Same art, same sim.
 */
export const FLAT_DEPTH = 0.5;
export const FLAT_SQUASH = 0.9;

/** Keeper dive shape. */
export const DIVE_DURATION = 0.68;
export const DIVE_FORWARD = 104;
export const DIVE_LIFT = 20;

/**
 * v6 keeper dive (candidate_01 pack): crouch anticipation → smeared launch → prone slide → recovery.
 * The launch delay + flight window drive the motion profile; the frame timeline lives in sim/keeper.ts.
 */
export const DIVE2_LAUNCH = 0.18;
export const DIVE2_FLIGHT = 0.28;

/**
 * Diving-keeper footprint. The dive frames are horizontal poses (wide, short bboxes), so sizing them by
 * height — like a standing sprite — inflates their width off-screen. Instead the dive's longest side is
 * normalized to the standing height × this factor, so a stretched-out keeper reads like a normal player.
 */
export const DIVE_LENGTH = 0.78;

/** Ball gravity (vz -= BALL_GRAVITY * dt). */
export const BALL_GRAVITY = 760;

/** Goal celebration freeze (seconds). */
export const CELEBRATION = 3.6;

/** Max real frame delta fed into the sim. */
export const MAX_DT = 0.04;
