/** Stable tunables ported from index_referee_spawn_clean.html. */

export const BALL_FRAME_COUNT = 20;

/** Match-clock acceleration (state.time += dt * TIME_SCALE). */
export const TIME_SCALE = 4.4;

/** Full-pitch match opening total duration (`features.openingFullPitch`). Set on `world.openingT` at the
 *  first Live kickoff; the camera holds the whole court then eases into follow. Single source so the
 *  setter and the camera's hold/ease split can't drift. */
export const OPENING_FULL_PITCH_SECONDS = 2.6;

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
/** Seconds of crouch before the launch/flight begins. MUST equal the sum of the two anticipation-frame
 *  durations in DIVE2_STEPS (sim/keeper.ts) so the motion launch stays synced to the launch frame. */
export const DIVE2_LAUNCH = 0.22;
export const DIVE2_FLIGHT = 0.53;

/** v6 dive trigger distance — earlier than legacy so the (now shorter) crouch plays out before the ball arrives. */
export const DIVE2_TRIGGER_RANGE = 320;

/**
 * Diving-keeper footprint. The dive frames are horizontal poses (wide, short bboxes), so sizing them by
 * height — like a standing sprite — inflates their width off-screen. Instead the dive's longest side is
 * normalized to the standing height × this factor, so a stretched-out keeper reads like a normal player.
 */
export const DIVE_LENGTH = 0.78;

/** Ball gravity (vz -= BALL_GRAVITY * dt). */
export const BALL_GRAVITY = 760;

/** Goal celebration freeze (seconds) — matches the GoalBurst overlay timeline (HOLD = 4.6s). */
export const CELEBRATION = 4.6;

/** Max real frame delta fed into the sim. */
export const MAX_DT = 0.04;
