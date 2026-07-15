import { BodyAnim, KickIntent, PlayerAction, Role, Team } from '../enums';
import { goalCenterForTeam } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { kickBall } from './ball';
import { Status } from './messages';
import { setStatus } from './rules';

/** Power-shot power + per-view timing (side is a longer 6-frame wind-up; front/back are 4 frames). */
const SHOT_POWER = 470;
function shotTiming(mode: BodyAnim): { dur: number; contact: number } {
  return mode === BodyAnim.PowerShotSide ? { dur: 0.72, contact: 0.66 } : { dur: 0.52, contact: 0.54 };
}

/** The goal the player is attacking — the exact point the strike is aimed at (shared by start + update). */
function goalPointFor(world: RealGkWorld, player: RealGkPlayer): { x: number; y: number } {
  // Aim at the opponent goal's actual mouth centre (per the court's calibrated GOALS geometry), NOT a
  // hardcoded lat/depth — on narrower courts (France) the goal sits at depth ~0.42, so a fixed 0.5 sent
  // shots downward past the mouth and flipped the strike pose (rear/front) the wrong way.
  const opponent = player.team === Team.Blue ? Team.Red : Team.Blue;
  const target = goalCenterForTeam(world.size, opponent);
  // Feed-driven: an outcome-specific aim (OffTarget wide / Woodwork post) wins, so the shot matches the
  // feed. Otherwise aim straight at the keeper (dive/claim wins it); the goal-mouth parry backstops
  // anything that slips past. Real goals arrive only via injectGoal.
  if (world.driven) {
    if (player.drivenShotAim) return player.drivenShotAim;
    const keeper = world.players.find((p) => p.team !== player.team && p.role === Role.GK);
    if (keeper) return { x: target.x, y: keeper.y + (Math.random() - 0.5) * 24 };
  }
  return target;
}

/**
 * The ball owner winds up a power shot; the actual strike fires at the contact frame. The pose follows the
 * DIRECTION TO THE GOAL (the same vector the ball travels), so the striker always faces where the ball goes:
 * rear pose when the goal is up/away, front when it's down/toward the camera, profile when it's mostly sideways.
 */
export function startPowerShot(world: RealGkWorld, player: RealGkPlayer, personas = false): boolean {
  const goal = goalPointFor(world, player);
  const gdx = goal.x - player.x;
  const gdy = goal.y - player.y;
  const upward = gdy < -Math.abs(gdx) * 0.35; // goal is clearly above → ball travels up
  const downward = gdy > Math.abs(gdx) * 0.35; // goal is clearly below → ball travels down
  if (Math.abs(gdx) > 1) player.facing = gdx < 0 ? -1 : 1; // face the goal horizontally (mirrors side/front)

  let mode = BodyAnim.PowerShotSide;
  let idle = player.idleMode;
  if (personas) {
    // Persona casting has only front/rear shot bodies — rear when the ball goes up, front otherwise
    // (down + sideways). Both are headless; the persona head composites on top.
    mode = upward ? BodyAnim.ShotBack : BodyAnim.ShotFront;
    idle = upward ? BodyAnim.IdleBack : BodyAnim.IdleFront;
  } else if (upward) {
    mode = BodyAnim.PowerShotBack;
    idle = BodyAnim.IdleBack;
  } else if (downward) {
    mode = BodyAnim.PowerShotFront;
    idle = BodyAnim.IdleFront;
  }
  player.action = PlayerAction.PowerShot;
  player.actionTimer = shotTiming(mode).dur;
  player.actionElapsed = 0;
  player.mode = mode;
  player.modeLock = shotTiming(mode).dur;
  player.idleMode = idle;
  player.powerShotHit = false;
  player.vx = 0;
  player.vy = 0;
  return true;
}

/**
 * Fires a shot on goal from the owner — the animated persona/power wind-up when enabled, else the legacy
 * instant strike. Shared by the autonomous owner AI (decideOwnerAction) and the feed director (injectShot).
 */
export function commitShot(world: RealGkWorld, owner: RealGkPlayer): void {
  world.intent.attackingTeam = owner.team;
  world.intent.threat = Math.max(world.intent.threat, 0.86);
  if (world.cfg.features?.extraAnims || world.cfg.features?.personaShot) {
    startPowerShot(world, owner, world.cfg.features?.personaHeads === true);
    return;
  }
  const goalPoint = goalPointFor(world, owner);
  kickBall(world, owner, goalPoint.x, goalPoint.y, 405, false, { intent: KickIntent.Shot });
  owner.drivenShotAim = null; // instant-strike path consumes the outcome aim immediately
  const note = Status.shot(owner.name);
  setStatus(world, note.title, note.text);
}

/** Ticks the wind-up (ball stays glued to the foot), blasts the goal at contact, then releases. */
export function updatePowerShot(world: RealGkWorld, player: RealGkPlayer, dt: number): boolean {
  if (player.action !== PlayerAction.PowerShot) return false;
  const timing = shotTiming(player.mode);
  player.actionTimer = Math.max(0, player.actionTimer - dt);
  player.actionElapsed += dt;
  const t = clamp(player.actionElapsed / timing.dur, 0, 1);
  player.vx = 0;
  player.vy = 0;
  if (!player.powerShotHit && t >= timing.contact) {
    player.powerShotHit = true;
    const goalPoint = goalPointFor(world, player);
    kickBall(world, player, goalPoint.x, goalPoint.y, SHOT_POWER, false, { intent: KickIntent.Shot });
    const note = Status.powerShot(player.name);
    setStatus(world, note.title, note.text);
  }
  if (player.actionTimer <= 0) {
    player.action = PlayerAction.None;
    player.mode = player.idleMode;
    player.modeLock = 0;
    player.drivenShotAim = null; // consumed — the next shot re-derives its aim from the feed outcome
    return false;
  }
  return true;
}
