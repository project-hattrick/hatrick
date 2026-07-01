import { animDuration } from '../assets/animation';
import { GOALKEEPER_SPECS } from '../assets/manifest';
import { PITCH } from '../core/constants';
import type { Player, World } from '../core/types';
import { GoalkeeperAnim } from '../enums';
import { clamp, moveTo, speed } from '../math/geometry';
import { MatchEvent } from './events';
import { gkClear, setEvent } from './rules';
import { dirOf, ownX } from './teams';

const DIVE_DUR = animDuration(GOALKEEPER_SPECS[GoalkeeperAnim.DiveFull]);
const HOLD_FRAMES = 18;
const HOLD_KICK_DELAY = 40;

/** Goalkeeper behaviour: hold + clear when owning the ball, otherwise guard the line / box. */
export function goalkeeperStep(p: Player, world: World): void {
  const { ball, tick } = world;
  const ogx = ownX(p.team);
  const line = ogx + dirOf(p.team) * 22;

  if (world.holder === p) {
    if (!p.holding) {
      p.holding = true;
      p.catchUntil = tick + HOLD_FRAMES;
      p.catchStart = tick;
      p.holdKick = tick + HOLD_KICK_DELAY;
      setEvent(world, MatchEvent.Save);
    }
    if (tick >= p.holdKick) {
      gkClear(world, p);
      p.holding = false;
    } else {
      p.vx *= 0.6;
      p.vy *= 0.6;
    }
    return;
  }

  p.holding = false;
  const inBox = Math.abs(ball.x - ogx) < PITCH.areaDepth && ball.y > PITCH.areaY0 && ball.y < PITCH.areaY1;
  if (inBox) {
    const advance = line + dirOf(p.team) * 36;
    moveTo(
      p,
      clamp(ball.x, Math.min(line, advance), Math.max(line, advance)),
      clamp(ball.y, PITCH.goalY0 - 16, PITCH.goalY1 + 16),
      2.9,
    );
    if (Math.abs(ball.y - p.y) > 22 && speed(ball) > 3) {
      p.diveUntil = tick + DIVE_DUR;
      p.diveStart = tick;
    }
    return;
  }
  moveTo(p, line, clamp(ball.y, PITCH.goalY0, PITCH.goalY1), 2.2);
}
