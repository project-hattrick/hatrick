import { GoalkeeperAnim, OutfieldAnim, StadiumKey, Team } from '../enums';
import type { AnimationSpec } from './types';

export const ASSET_ROOT = '/game';
export const BALL_FRAMES = 19;

/** Outfield sprites come from one uniform source (player_complete), so a single base scale fits all. */
export const OUTFIELD_SPECS: Record<OutfieldAnim, AnimationSpec> = {
  [OutfieldAnim.Idle]: { frames: 5, fps: 4, scale: 1, loop: true },
  [OutfieldAnim.Run]: { frames: 8, fps: 16, scale: 1, loop: true },
  [OutfieldAnim.Kick]: { frames: 7, fps: 16, scale: 1, loop: false },
  [OutfieldAnim.Tackle]: { frames: 6, fps: 12, scale: 1, loop: false },
  [OutfieldAnim.Celebrate]: { frames: 7, fps: 8, scale: 1, loop: true },
};

/** Keeper sprites share a slightly taller base scale (the gk set draws with the head/no shadow). */
export const GOALKEEPER_SPECS: Record<GoalkeeperAnim, AnimationSpec> = {
  [GoalkeeperAnim.Ready]: { frames: 5, fps: 8, scale: 1.18, loop: true },
  [GoalkeeperAnim.Shuffle]: { frames: 5, fps: 9, scale: 1.18, loop: true },
  [GoalkeeperAnim.Run]: { frames: 20, fps: 13, scale: 1.18, loop: true },
  [GoalkeeperAnim.CatchHigh]: { frames: 5, fps: 8, scale: 1.18, loop: false },
  [GoalkeeperAnim.SaveLow]: { frames: 6, fps: 11, scale: 1.18, loop: false },
  [GoalkeeperAnim.DiveFull]: { frames: 14, fps: 12, scale: 1.18, loop: false },
  [GoalkeeperAnim.GoalKick]: { frames: 9, fps: 11, scale: 1.18, loop: false },
};

export const STADIUM_PATHS: Record<StadiumKey, string> = {
  [StadiumKey.RainCourt]: `${ASSET_ROOT}/stadiums/rain-court/court.png`,
};

const TEAM_SLUG: Record<Team, string> = {
  [Team.Blue]: 'blue',
  [Team.Red]: 'red',
};

const pad2 = (i: number): string => String(i).padStart(2, '0');

export const outfieldDir = (team: Team, anim: OutfieldAnim): string =>
  `${ASSET_ROOT}/actors/outfield/${TEAM_SLUG[team]}/${anim}`;

export const goalkeeperDir = (anim: GoalkeeperAnim): string => `${ASSET_ROOT}/actors/goalkeeper/${anim}`;

export const framePath = (dir: string, i: number): string => `${dir}/frame_${pad2(i)}.png`;

export const ballFramePath = (i: number): string => `${ASSET_ROOT}/ball/frames/ball-${pad2(i)}.png`;

/** Index of the squashed-on-impact ball sprite. */
export const BALL_IMPACT_FRAME = 18;

/** Picks a ball sprite by speed band (slow/medium/fast roll) + roll phase. */
export function ballFrameIndex(spd: number, roll: number): number {
  const [lo, hi] = spd < 60 ? [0, 4] : spd < 250 ? [5, 13] : [14, 17];
  return lo + (Math.floor(roll / 3.5) % (hi - lo + 1));
}
