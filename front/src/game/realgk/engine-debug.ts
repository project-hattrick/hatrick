import { MatchPhase, Team } from './enums';
import type { RealGkWorld } from './types';
import { injectCardDriven, injectCornerDriven, injectFreeKickDriven, injectPenaltyDriven, injectShotDriven } from './sim/driver';
import { goal } from './sim/rules';

/** The events the /engine "Spawn event" buttons can force on demand. */
export type DebugEventKind = 'goal' | 'shot' | 'corner' | 'card' | 'red' | 'penalty' | 'freeKick';

/**
 * Force a match event ON DEMAND (the /engine event buttons). Unlike the feed injectors — which bail when a
 * restart is already staging and never actually count a goal — this clears any in-flight restart first and
 * a Goal really scores + celebrates, so pressing the button always makes the action happen. Requires the
 * `deadBallSequence` / `fouls` features for the set-piece flows (the /engine fixture config has them).
 */
export function debugEvent(world: RealGkWorld, kind: DebugEventKind, team: Team): void {
  // Only act during live play — mid-celebration/replay/half-time a forced event would fight the flow.
  if (world.match.phase !== MatchPhase.Live) return;
  // A staging restart owns the ball and blocks the feed injectors — clear it so the new event fires.
  if (kind !== 'card' && kind !== 'red') world.match.restart = null;
  switch (kind) {
    case 'goal':
      goal(world, team, true); // count it + run the full celebration/replay flow
      return;
    case 'shot':
      injectShotDriven(world, team);
      return;
    case 'corner':
      injectCornerDriven(world, team);
      return;
    case 'card':
      injectCardDriven(world, team, false);
      return;
    case 'red':
      injectCardDriven(world, team, true);
      return;
    case 'penalty':
      injectPenaltyDriven(world, team);
      return;
    case 'freeKick':
      injectFreeKickDriven(world, team, 0.7);
      return;
  }
}
