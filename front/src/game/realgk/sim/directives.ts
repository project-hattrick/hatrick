import { DrivenDirective, MatchPhase, Team } from '../enums';
import type { PendingDirective, RealGkWorld } from '../types';
import {
  injectCardDriven,
  injectCornerDriven,
  injectFreeKickDriven,
  injectGoalDriven,
  injectPenaltyDriven,
  injectShotDriven,
  setPossessionDriven,
} from './driver';

/**
 * Feed directives arriving while the intro plays (buffering hold / walk-on) can't act on the pitch —
 * they queue here and flush the moment the intro kicks off into Live. Possession coalesces to the
 * latest; `setScore`/`setClock` are plain state and never queue.
 */

const MAX_PENDING = 8;

function applyDirective(world: RealGkWorld, d: PendingDirective): void {
  switch (d.kind) {
    case DrivenDirective.Possession:
      setPossessionDriven(world, d.team, d.threat);
      return;
    case DrivenDirective.Shot:
      injectShotDriven(world, d.team, d.outcome);
      return;
    case DrivenDirective.Goal:
      injectGoalDriven(world, d.team);
      return;
    case DrivenDirective.Corner:
      injectCornerDriven(world, d.team);
      return;
    case DrivenDirective.Card:
      injectCardDriven(world, d.team, d.red === true);
      return;
    case DrivenDirective.Penalty:
      injectPenaltyDriven(world, d.team);
      return;
    case DrivenDirective.FreeKick:
      injectFreeKickDriven(world, d.team, d.threat);
      return;
  }
}

/** Runs a feed directive now, or queues it while the intro owns the pitch.
 *  (Half/full-time gating happens in the engine's handle wrappers — see `direct` in engine.ts —
 *  to keep this module free of a sim→world import cycle.) */
export function directDriven(world: RealGkWorld, kind: DrivenDirective, team: Team, threat = 0, red = false, outcome?: string): void {
  if (world.match.phase !== MatchPhase.Intro) {
    applyDirective(world, { kind, team, threat, red, outcome });
    return;
  }
  if (kind === DrivenDirective.Possession) {
    world.pendingDirectives = world.pendingDirectives.filter((d) => d.kind !== DrivenDirective.Possession);
  }
  if (world.pendingDirectives.length >= MAX_PENDING) return;
  world.pendingDirectives.push({ kind, team, threat, red, outcome });
}

/** Flushes everything queued during the intro (called when the intro hands over to Live). */
export function flushDirectives(world: RealGkWorld): void {
  const queued = world.pendingDirectives;
  world.pendingDirectives = [];
  for (const d of queued) applyDirective(world, d);
}
