import { BodyAnim, CelebrationKind, CelebrationPhase, PlayerAction, Role, RunKind, Team } from '../enums';
import { pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { PERSONA_COUNT } from '../assets/manifest';
import { freshPlayerFeel } from './feel';

const BLUE_PERSONAS = [3, 7, 0, 9, 4, 1, 10, 5, 2, 8, 6];
const RED_PERSONAS = [8, 2, 6, 1, 10, 7, 3, 0, 9, 5, 4];

/** The persona head index for a team's squad slot (stable; shared with replay playback). */
export function personaIdFor(team: Team, slot: number): number {
  const order = team === Team.Red ? RED_PERSONAS : BLUE_PERSONAS;
  return order[((slot % order.length) + order.length) % order.length] % Math.max(1, PERSONA_COUNT);
}

/** Builds one player object at (lat, depth) for the given team. */
export function createPlayer(world: RealGkWorld, team: Team, role: Role, lat: number, depth: number, name: string, slotIndex?: number): RealGkPlayer {
  const dir = team === Team.Blue ? 1 : -1;
  const pt = pointOnField(world.size, lat, depth);
  const idle = role === Role.GK ? BodyAnim.GkIdle : dir > 0 ? BodyAnim.IdleFront : BodyAnim.IdleBack;
  const id = world.nextPlayerId++;
  return {
    id,
    personaId: personaIdFor(team, slotIndex ?? id),
    name,
    team,
    dir,
    role,
    homeLat: lat,
    homeDepth: depth,
    x: pt.x,
    y: pt.y,
    vx: 0,
    vy: 0,
    facing: dir,
    lookX: dir,
    lookY: 0,
    desiredLookX: dir,
    desiredLookY: 0,
    facingLock: 0,
    pendingFacing: dir,
    pendingFacingTime: 0,
    targetX: pt.x,
    targetY: pt.y,
    idleMode: idle,
    modeLock: 0,
    mode: idle,
    think: Math.random() * 0.4,
    action: PlayerAction.None,
    actionTimer: 0,
    actionElapsed: 0,
    diveDir: dir,
    diveStartX: pt.x,
    diveStartY: pt.y,
    saveCooldown: 0,
    celebrationKind: CelebrationKind.None,
    celebrationPhase: CelebrationPhase.None,
    celebrationTimer: 0,
    celebrationLift: 0,
    brakeCooldown: 0,
    prevSpeed: 0,
    headerCooldown: 0,
    headerHit: false,
    receiveCooldown: 0,
    receiveHit: false,
    powerShotHit: false,
    slideCooldown: 0,
    slideHit: false,
    introDelay: 0,
    spawnX: pt.x,
    spawnY: pt.y,
    feel: freshPlayerFeel(idle),
    runKind: RunKind.None,
    runTargetLat: lat,
    runTargetDepth: depth,
    runTimer: 0,
    runCooldown: 0,
    markId: -1,
    markCooldown: 0,
    isPresser: false,
    // Small per-slot lateral spread (±) so lines under smartAI keep width instead of stacking.
    laneOffset: (((slotIndex ?? id) % 3) - 1) * 0.03,
  };
}
