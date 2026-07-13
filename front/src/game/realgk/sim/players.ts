import { BodyAnim, CelebrationPhase, PlayerAction, Role, RunKind, Team } from '../enums';
import { fieldBounds, fieldRatios, pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { ITEM_MAP } from '../assets/items';
import { spawnFootDust } from '../effects';
import { ballOwner, kickBall, teamPlayers } from './ball';
import { updatePlayerCelebration } from './celebration';
import { fillerShotAllowed } from './filler';
import { FORMATION } from './formation';
import { isControlled, updateControlledPlayer, updateKeeperAutopilot } from './control';
import { maybeTriggerHeader, updateHeader } from './header';
import { maybeTriggerReceive, updateReceive } from './receive';
import { commitShot, updatePowerShot } from './shot';
import { maybeTriggerSlideTackle, updateSlideTackle } from './slide';
import { buildShapeContext, decideOwnerActionSmart, smartSupportTarget, supportTarget, updateMarking, updateOffBallRun } from './positioning';
import { dive2FrameAt, keeperCrossTarget, maybeTriggerKeeperDive, updateKeeperDive } from './keeper';
import { Status } from './messages';
import { createPlayer } from './player-factory';
import { setStatus } from './rules';

const TEAM_TAG: Record<Team, string> = { [Team.Blue]: 'BLU', [Team.Red]: 'RED' };

/** Playable sandbox roster: `playableRoster` Blue teammates near center (1 = solo court test). */
function resetPlayablePlayers(world: RealGkWorld): void {
  const roster = Math.max(1, Math.min(2, Math.round(world.cfg.playableRoster ?? 2)));
  world.players = [createPlayer(world, Team.Blue, Role.ST, roster > 1 ? 0.42 : 0.5, 0.5, 'YOU-1')];
  if (roster > 1) world.players.push(createPlayer(world, Team.Blue, Role.MID, 0.58, 0.5, 'YOU-2'));
  const gk = world.cfg.playableGoalkeeper ? createPlayer(world, Team.Blue, Role.GK, 0.08, 0.5, 'GK') : null;
  if (gk) world.players.push(gk);
  world.controlId = world.cfg.keeperControl && gk ? gk.id : world.players[0].id;
}

/** (Re)spawns the squads: full 11-a-side, or the 2-player sandbox when `playable`. */
export function resetPlayers(world: RealGkWorld): void {
  world.players = [];
  world.nextPlayerId = 1;
  if (world.cfg.features?.playable) {
    resetPlayablePlayers(world);
    return;
  }
  for (const team of [Team.Blue, Team.Red]) {
    const names = team === Team.Blue ? world.cfg.rosterNames?.blue : world.cfg.rosterNames?.red;
    FORMATION.forEach((slot, index) => {
      const lat = team === Team.Blue ? slot.lat : 1 - slot.lat;
      // Real feed name for this slot when available, else the generic CODE label.
      const label = names?.[index]?.trim() || `${TEAM_TAG[team]}-${index + 1}`;
      world.players.push(createPlayer(world, team, slot.role, lat, slot.depth, label, index));
    });
  }
  // A red card holds across kickoff resets — the sent-off player stays in the dressing room (v5 fouls).
  if (world.sentOffNames.length) {
    world.players = world.players.filter((p) => !world.sentOffNames.includes(p.name));
  }
}

/** Seconds after the intro's rise begins before each line starts walking on (back-to-front). */
const INTRO_ROLE_DELAY: Record<Role, number> = {
  [Role.GK]: 0,
  [Role.DEF]: 0.25,
  [Role.MID]: 0.6,
  [Role.ST]: 0.95,
};

/**
 * v5 intro: parks each player DIRECTLY BELOW their own formation home, so they walk straight up into place
 * and the formation shape is preserved (spawning everyone on one depth line collapsed same-lat players onto
 * one point). Staggered walk-on delays by line (back-to-front).
 */
// Deepest intro spawn as a ratio of world height: the pink apron below the pitch (grass ends ≈ 0.697,
// the perimeter wall starts ≈ 0.74 on the court image) — players must never park beyond the wall.
const INTRO_APRON_MAX_DEPTH = 0.725;

export function placePlayersOffPitch(world: RealGkWorld): void {
  const rise = world.size.height * 0.3; // how far below home each player starts
  const apronMaxY = world.size.height * INTRO_APRON_MAX_DEPTH;
  let blueIdx = 0;
  let redIdx = 0;
  for (const p of world.players) {
    const idx = p.team === Team.Blue ? blueIdx++ : redIdx++;
    const home = pointOnField(world.size, p.homeLat, p.homeDepth);
    p.spawnX = home.x;
    p.spawnY = Math.min(home.y + rise, apronMaxY);
    p.x = p.spawnX;
    p.y = p.spawnY;
    p.vx = 0;
    p.vy = 0;
    p.targetX = p.spawnX;
    p.targetY = p.spawnY;
    p.introDelay = INTRO_ROLE_DELAY[p.role] + idx * 0.05;
    p.mode = p.idleMode;
  }
}

export function nearestPlayerToBall(world: RealGkWorld, team: Team): RealGkPlayer | null {
  const { ball } = world;
  const roster = world.players.filter((p) => p.team === team);
  if (!roster.length) return null;
  return roster.reduce((best, p) => {
    const pd = Math.hypot(p.x - ball.x, p.y - ball.y);
    const bd = Math.hypot(best.x - ball.x, best.y - ball.y);
    return pd < bd ? p : best;
  });
}

export function chooseMode(player: RealGkPlayer): BodyAnim {
  const dx = player.vx;
  const dy = player.vy;
  const speed = Math.hypot(dx, dy);
  if (player.role === Role.GK) {
    if (player.action === PlayerAction.Dive && player.actionTimer > 0) {
      return player.mode === BodyAnim.GkDiveV2 ? BodyAnim.GkDiveV2 : BodyAnim.GkDive;
    }
    if (speed < 12) return player.idleMode;
    if (Math.abs(dx) > Math.abs(dy) * 1.18 && Math.abs(dx) > 18) return BodyAnim.GkRunSide;
    return BodyAnim.GkShuffle;
  }
  if (speed < 24) return player.idleMode;
  if (Math.abs(dx) > Math.abs(dy) * 1.38 && Math.abs(dx) > 28) return BodyAnim.RunSide;
  if (dy < 0) return speed > 120 ? BodyAnim.RunBack : BodyAnim.WalkBack;
  return speed > 120 ? BodyAnim.RunFront : BodyAnim.WalkFront;
}

/** Static open-arms frame held during the Pose/Loop celebration phases (playground frame 2). */
const ARMSUP_HOLD_FRAME = 2;

export function frameIndexFor(player: RealGkPlayer, now: number, phaseSeconds: number | null = null): number {
  const item = ITEM_MAP[player.mode];
  if (player.mode.startsWith('idle') || player.mode === BodyAnim.GkIdle) return 0;
  if (!item) return 0;
  if (player.celebrationPhase !== CelebrationPhase.None) {
    if (player.celebrationPhase === CelebrationPhase.Pose || player.celebrationPhase === CelebrationPhase.Loop) return ARMSUP_HOLD_FRAME;
    // Celebration anims cycle off the phase clock (playground: phaseAnimTime modulo).
    return Math.floor(player.actionElapsed * item.fps) % item.frames.length;
  }
  // The v6 dive plays a non-uniform timeline (anticipation holds + smeared launch), not a flat fps.
  if (player.mode === BodyAnim.GkDiveV2) return dive2FrameAt(player.actionElapsed);
  // Non-looping actions (dive, turn, brake) play once off their own clock.
  if (!item.loop) return Math.min(item.frames.length - 1, Math.floor(player.actionElapsed * item.fps));
  // feel.animPhase: a per-player clock that resets to 0 on a mode switch, so a switch always starts at
  // frame 0 instead of landing on an arbitrary frame of the global clock's cycle (the visible "jump").
  if (phaseSeconds !== null) return Math.floor(phaseSeconds * item.fps) % item.frames.length;
  return Math.floor((now / 1000) * item.fps) % item.frames.length;
}

function updateLook(player: RealGkPlayer, desiredLookX: number, desiredLookY: number, dt: number): void {
  const len = Math.hypot(desiredLookX, desiredLookY) || 1;
  player.desiredLookX = desiredLookX / len;
  player.desiredLookY = desiredLookY / len;
  const blend = Math.min(1, dt * 7.5);
  player.lookX += (player.desiredLookX - player.lookX) * blend;
  player.lookY += (player.desiredLookY - player.lookY) * blend;
  const lookLen = Math.hypot(player.lookX, player.lookY) || 1;
  player.lookX /= lookLen;
  player.lookY /= lookLen;
}

function updateFacingGuard(player: RealGkPlayer, dt: number): void {
  player.facingLock = Math.max(0, player.facingLock - dt);
  const horizontalIntent = player.lookX;
  if (Math.abs(horizontalIntent) < 0.28) {
    player.pendingFacingTime = 0;
    return;
  }
  const desiredFacing = horizontalIntent < 0 ? -1 : 1;
  if (desiredFacing === player.facing) {
    player.pendingFacing = desiredFacing;
    player.pendingFacingTime = 0;
    return;
  }
  if (player.pendingFacing !== desiredFacing) {
    player.pendingFacing = desiredFacing;
    player.pendingFacingTime = 0;
    return;
  }
  player.pendingFacingTime += dt;
  if (player.facingLock <= 0 && player.pendingFacingTime >= 0.14 && Math.abs(horizontalIntent) >= 0.5) {
    player.facing = desiredFacing;
    player.facingLock = 0.22;
    player.pendingFacingTime = 0;
  }
}

const SIDE_MODES = new Set<BodyAnim>([BodyAnim.RunSide, BodyAnim.GkRunSide, BodyAnim.GkDive]);

/** Ticks a one-shot outfield action (turn / brake): hold position, play out, then release. */
function updateOutfieldAction(player: RealGkPlayer, dt: number): boolean {
  if (player.action !== PlayerAction.TurnSide && player.action !== PlayerAction.StopBrake) return false;
  player.actionTimer = Math.max(0, player.actionTimer - dt);
  player.actionElapsed += dt;
  player.vx *= Math.pow(0.4, dt * 60);
  player.vy *= Math.pow(0.4, dt * 60);
  if (player.actionTimer === 0) {
    player.action = PlayerAction.None;
    player.actionElapsed = 0;
    player.modeLock = 0;
    player.mode = player.idleMode;
    return false;
  }
  return true;
}

const TURN_SECONDS = 0.48;
const BRAKE_SECONDS = 0.42;
const BRAKE_COOLDOWN = 1.4;

/** Fires turn_side on a run-direction reversal, or stop_brake on a hard arrival from a sprint. */
function startTurnOrBrake(player: RealGkPlayer, facingBefore: number, targetDist: number, stopRadius: number): boolean {
  const speed = Math.hypot(player.vx, player.vy);
  if (player.facing !== facingBefore && player.mode === BodyAnim.RunSide && Math.abs(player.vx) > 60) {
    player.action = PlayerAction.TurnSide;
    player.actionTimer = TURN_SECONDS;
    player.actionElapsed = 0;
    player.mode = BodyAnim.TurnSide;
    player.modeLock = TURN_SECONDS;
    return true;
  }
  const arriving = targetDist <= stopRadius + 6;
  // prevSpeed is a decaying recent peak — arrival easing bleeds speed over ~10 frames, so a
  // one-frame lookback would never see the sprint that led into the stop.
  const wasSprinting = player.prevSpeed > 110;
  const facingAway = player.mode.includes('back');
  if (arriving && wasSprinting && speed < 70 && !facingAway && player.brakeCooldown <= 0) {
    player.action = PlayerAction.StopBrake;
    player.actionTimer = BRAKE_SECONDS;
    player.actionElapsed = 0;
    player.mode = BodyAnim.StopBrake;
    player.modeLock = BRAKE_SECONDS;
    player.brakeCooldown = BRAKE_COOLDOWN;
    return true;
  }
  return false;
}

/** Steers a player toward (tx,ty) with arrival easing, clamps to pitch, and resolves the body mode.
 *  `clampToPitch=false` lets a player enter from off the pitch (v5 intro walk-on) without snapping to the edge. */
export function moveToward(world: RealGkWorld, player: RealGkPlayer, tx: number, ty: number, topSpeed: number, dt: number, clampToPitch = true): void {
  if (player.role === Role.GK) {
    player.saveCooldown = Math.max(0, player.saveCooldown - dt);
    if (updateKeeperDive(player, dt)) return;
  }

  const extraAnims = world.cfg.features?.extraAnims === true;
  if (extraAnims) {
    player.brakeCooldown = Math.max(0, player.brakeCooldown - dt);
    if (updateOutfieldAction(player, dt)) return;
  }

  player.targetX += (tx - player.targetX) * Math.min(1, dt * 4.2);
  player.targetY += (ty - player.targetY) * Math.min(1, dt * 4.2);

  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const len = Math.hypot(dx, dy);
  const stopRadius = player.role === Role.GK ? 10 : 14;
  const slowRadius = player.role === Role.GK ? 32 : 40;

  if (len <= stopRadius) {
    player.vx *= Math.pow(0.52, dt * 60);
    player.vy *= Math.pow(0.52, dt * 60);
  } else if (len > 0.01) {
    const arrival = clamp((len - stopRadius) / Math.max(1, slowRadius - stopRadius), 0.22, 1);
    const desiredX = (dx / len) * topSpeed * arrival;
    const desiredY = (dy / len) * topSpeed * arrival;
    player.vx += (desiredX - player.vx) * Math.min(1, dt * 4.6);
    player.vy += (desiredY - player.vy) * Math.min(1, dt * 4.6);
    if (len > stopRadius + 4) updateLook(player, dx / len, dy / len, dt);
  } else {
    player.vx *= Math.pow(0.7, dt * 60);
    player.vy *= Math.pow(0.7, dt * 60);
  }

  const snapSpeed = player.role === Role.GK ? 8 : 12;
  if (len <= stopRadius + 2 && Math.hypot(player.vx, player.vy) < snapSpeed) {
    player.vx = 0;
    player.vy = 0;
  }

  player.x += player.vx * dt;
  player.y += player.vy * dt;
  if (clampToPitch) {
    const bounds = fieldBounds(world.size, player.y);
    player.y = clamp(player.y, bounds.topY + 4, bounds.bottomY - 8);
    player.x = clamp(player.x, bounds.left + 12, bounds.right - 12);
  }
  const facingBefore = player.facing;
  updateFacingGuard(player, dt);

  // Skid dust: a hard left/right reversal while running kicks up a puff off the feet (gated by ballEffects).
  if (player.role !== Role.GK && player.facing !== facingBefore && Math.abs(player.vx) > 60) {
    spawnFootDust(world, player.x, player.y, Math.abs(player.vx), player.facing);
  }

  if (extraAnims && player.role !== Role.GK && startTurnOrBrake(player, facingBefore, len, stopRadius)) return;
  // Decaying recent-peak speed (~150 px/s² bleed) so the brake can see the sprint that just ended.
  player.prevSpeed = Math.max(Math.hypot(player.vx, player.vy), player.prevSpeed - 150 * dt);

  player.modeLock = Math.max(0, player.modeLock - dt);
  if (player.role === Role.GK) player.idleMode = BodyAnim.GkIdle;
  else if (Math.abs(player.vy) > 18) player.idleMode = player.vy < 0 ? BodyAnim.IdleBack : BodyAnim.IdleFront;
  else if (Math.abs(player.lookY) > 0.72) player.idleMode = player.lookY < 0 ? BodyAnim.IdleBack : BodyAnim.IdleFront;

  const nextMode = chooseMode(player);
  const currentIsSide = SIDE_MODES.has(player.mode);
  const nextIsSide = SIDE_MODES.has(nextMode);
  const switchingSideState = currentIsSide !== nextIsSide;
  const goingIdle = nextMode === player.idleMode;
  const canChangeMode = player.modeLock <= 0 && (goingIdle || !switchingSideState || Math.abs(player.vx) > 34);
  if (nextMode !== player.mode && canChangeMode) {
    player.mode = nextMode;
    player.modeLock = nextIsSide || currentIsSide ? 0.14 : 0.1;
  }
}

/** Stable per-player pseudo-random in [0,1) from id + salt — deterministic identity variety (no per-frame RNG). */
function idNoise(id: number, salt: number): number {
  const x = Math.sin(id * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function decideOwnerAction(world: RealGkWorld, owner: RealGkPlayer): void {
  if (world.cfg.features?.smartAI) {
    decideOwnerActionSmart(world, owner);
    return;
  }
  const { size } = world;
  const goalPoint = pointOnField(size, owner.team === Team.Blue ? 0.98 : 0.02, 0.5);
  const distToGoal = Math.hypot(goalPoint.x - owner.x, goalPoint.y - owner.y);
  const teammates = teamPlayers(world, owner.team).filter((p) => p.id !== owner.id && p.role !== Role.GK);
  const forwardMate = teammates
    .filter((p) => owner.dir * (p.x - owner.x) > 18)
    .sort((a, b) => (owner.dir > 0 ? b.x - a.x : a.x - b.x))[0];

  if (owner.role === Role.GK) {
    const outlet = teammates.sort((a, b) => Math.hypot(a.x - owner.x, a.y - owner.y) - Math.hypot(b.x - owner.x, b.y - owner.y))[0];
    if (outlet) {
      kickBall(world, owner, outlet.x + owner.dir * 12, outlet.y, 286, Math.random() < 0.24);
      const note = Status.gkOutlet(owner.name);
      setStatus(world, note.title, note.text);
    }
    return;
  }

  // Autonomous shot on goal — suppressed while feed-driven (shots come from injectShot), except the
  // occasional drivenFiller attempt (which the goal-mouth parry keeps harmless).
  if (distToGoal < 180 && (!world.driven || fillerShotAllowed(world))) {
    commitShot(world, owner);
    return;
  }
  if (forwardMate && Math.random() < 0.63) {
    kickBall(world, owner, forwardMate.x + owner.dir * 18, forwardMate.y, 298, Math.random() < 0.22);
    const note = Status.through(owner.name, forwardMate.name);
    setStatus(world, note.title, note.text);
    return;
  }
  if (Math.random() < 0.18) {
    const ratios = fieldRatios(size, owner.x, owner.y);
    const loft = pointOnField(
      size,
      clamp(ratios.lat + owner.dir * 0.16, 0.04, 0.96),
      clamp(ratios.depth + (Math.random() - 0.5) * 0.2, 0.12, 0.88),
    );
    kickBall(world, owner, loft.x, loft.y, 332, true);
    const note = Status.switchPlay(owner.name);
    setStatus(world, note.title, note.text);
  }
}

/** Orients players to watch the ball; with `livelyMatch`, only nearby players lock onto it while the rest
 *  hold a stable per-player resting orientation so the field shows varied facings (not one staring crowd). */
export function faceBall(world: RealGkWorld): void {
  const { players, ball, size } = world;
  const lively = world.cfg.features?.livelyMatch === true;
  for (const p of players) {
    if (ball.ownerId === p.id) continue;
    if (p.role === Role.GK) continue;
    if (p.celebrationPhase !== CelebrationPhase.None) continue;
    // Don't re-face a player mid one-shot (turn/brake/header/receive) — it would flip the sprite's mirror.
    if (
      p.action === PlayerAction.TurnSide ||
      p.action === PlayerAction.StopBrake ||
      p.action === PlayerAction.Header ||
      p.action === PlayerAction.Receive ||
      p.action === PlayerAction.PowerShot ||
      p.action === PlayerAction.SlideTackle
    ) {
      continue;
    }
    const dx = ball.x - p.x;
    const dy = ball.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    let lx = dx / len;
    let ly = dy / len;
    if (lively) {
      // Near the ball → watch it; far → blend toward a stable per-player rest orientation (checking a mark /
      // space), so idle players face a mix of directions instead of all snapping toward the ball.
      const near = clamp(1 - len / (size.height * 0.42), 0, 1);
      const restX = clamp(p.dir * 0.5 + (idNoise(p.id, 4) - 0.5) * 0.9, -1, 1);
      const restY = (idNoise(p.id, 5) - 0.5) * 1.7;
      lx = lx * near + restX * (1 - near);
      ly = ly * near + restY * (1 - near);
      const l = Math.hypot(lx, ly) || 1;
      lx /= l;
      ly /= l;
    }
    p.lookX = lx;
    p.lookY = ly;
    p.desiredLookX = lx;
    p.desiredLookY = ly;
    p.facing = lx < 0 ? -1 : 1;
    if (Math.abs(ly) >= Math.abs(lx)) {
      p.idleMode = ly < 0 ? BodyAnim.IdleBack : BodyAnim.IdleFront;
    }
  }
}

/**
 * Idles ONE player with life: a stable, varied resting orientation (so the squad doesn't all stare the
 * same way — the "everyone idle facing back" look) plus a gentle weight-shift sway around their formation
 * home. Position is set ABSOLUTELY from home each tick (offset never accumulates → no drift). Used by the
 * pre-kickoff intro hold, where the autonomous `faceBall`/AI aren't running yet.
 */
export function livelyIdlePlayer(world: RealGkWorld, p: RealGkPlayer, t: number): void {
  if (p.role === Role.GK) {
    p.vx = 0;
    p.vy = 0;
    p.idleMode = BodyAnim.GkIdle;
    p.mode = BodyAnim.GkIdle;
    return;
  }
  const home = pointOnField(world.size, p.homeLat, p.homeDepth);
  const scale = world.cfg.fieldScale / 1.5;
  const phase = idNoise(p.id, 6) * Math.PI * 2;
  // Subtle, out-of-phase sway per player — reads as shifting weight / shuffling, not marching in lockstep.
  p.x = home.x + Math.sin(t * 1.2 + phase) * 2.6 * scale;
  p.y = home.y + Math.sin(t * 0.85 + phase * 1.4) * 1.3 * scale;
  p.vx = 0;
  p.vy = 0;
  // Stable per-player rest orientation: some watch the ball area, some glance off — a mix of front/back
  // idle bodies plus left/right mirror, instead of a uniform wall of backs.
  const restX = clamp(p.dir * 0.35 + (idNoise(p.id, 4) - 0.5) * 1.3, -1, 1);
  const restY = (idNoise(p.id, 5) - 0.5) * 1.5;
  const len = Math.hypot(restX, restY) || 1;
  p.lookX = restX / len;
  p.lookY = restY / len;
  p.desiredLookX = p.lookX;
  p.desiredLookY = p.lookY;
  p.facing = p.lookX < 0 ? -1 : 1;
  p.idleMode = p.lookY < 0 ? BodyAnim.IdleBack : BodyAnim.IdleFront;
  p.mode = p.idleMode;
}

/** Applies `livelyIdlePlayer` to the whole squad off the intro clock (pre-kickoff hold). */
export function applyLivelyIdle(world: RealGkWorld): void {
  for (const p of world.players) livelyIdlePlayer(world, p, world.match.introTimer);
}

/** Per-player AI + soft body separation for one tick. */
export function updatePlayers(world: RealGkWorld, dt: number): void {
  const { players, ball, match, size } = world;
  const owner = ballOwner(world);
  const possessionTeam = owner ? owner.team : null;
  const blueChaser = nearestPlayerToBall(world, Team.Blue);
  const redChaser = nearestPlayerToBall(world, Team.Red);
  // smartAI: dynamic team shape + runs + press/mark. Shared context computed once per tick (null = legacy).
  const shapeCtx = world.cfg.features?.smartAI ? buildShapeContext(world) : null;

  // Sandbox: control follows the Blue player who has the ball, so a pass hands control to the receiver.
  // keeperControl pins control to the keeper instead — a pass out must not drag control upfield.
  if (world.cfg.features?.playable && !world.cfg.keeperControl && owner && owner.team === Team.Blue) world.controlId = owner.id;

  // Feel-comparison grid: drive the pinned keeper's control input + punt automatically.
  if (world.cfg.keeperAutopilot) updateKeeperAutopilot(world);

  for (const player of players) {
    if (match.celebration > 0) {
      if (player.celebrationPhase !== CelebrationPhase.None) {
        updatePlayerCelebration(world, player, dt);
      } else {
        const pt = pointOnField(size, player.homeLat, player.homeDepth);
        moveToward(world, player, pt.x, pt.y, player.role === Role.GK ? 70 : 110, dt);
      }
      continue;
    }

    player.headerCooldown = Math.max(0, player.headerCooldown - dt);
    player.receiveCooldown = Math.max(0, player.receiveCooldown - dt);
    // An in-progress header/receive owns the tick (holds position, plays the one-shot once).
    if (player.action === PlayerAction.Header) {
      updateHeader(world, player, dt);
      continue;
    }
    if (player.action === PlayerAction.Receive) {
      updateReceive(world, player, dt);
      continue;
    }
    if (player.action === PlayerAction.PowerShot) {
      updatePowerShot(world, player, dt);
      continue;
    }
    player.slideCooldown = Math.max(0, player.slideCooldown - dt);
    if (player.action === PlayerAction.SlideTackle) {
      updateSlideTackle(world, player, dt);
      continue;
    }

    // The keyboard-controlled keeper never auto-dives — saves are the player's call (Q/E). An
    // in-flight manual dive still owns the tick so header/receive triggers can't hijack it.
    const keeperUnderControl = world.cfg.features?.playable === true && player.id === world.controlId && world.cfg.keeperControl === true;
    if (player.role === Role.GK && keeperUnderControl) {
      // Autopilot (feel grid): let the pinned keeper auto-dive at incoming shots like an AI keeper.
      if (world.cfg.keeperAutopilot && player.action !== PlayerAction.Dive) maybeTriggerKeeperDive(world, player);
      if (updateKeeperDive(player, dt)) continue;
    }
    // Keeper comes off his line to claim a central cross/corner (livelyMatch keepers): rush to the drop,
    // then maybeClaimBall catches it on landing. Wide/deep balls are left to the defenders.
    if (player.role === Role.GK && !keeperUnderControl && world.cfg.features?.livelyMatch) {
      const claim = keeperCrossTarget(world, player);
      if (claim) {
        moveToward(world, player, claim.x, claim.y, 165, dt);
        continue;
      }
    }
    if (player.role === Role.GK && !keeperUnderControl && maybeTriggerKeeperDive(world, player)) {
      updateKeeperDive(player, dt);
      continue;
    }

    // A reachable airborne ball triggers a jump-header; a fast incoming ground ball a first-touch trap.
    if (maybeTriggerHeader(world, player)) {
      updateHeader(world, player, dt);
      continue;
    }
    if (maybeTriggerReceive(world, player)) {
      updateReceive(world, player, dt);
      continue;
    }
    // Slide tackles are pure steals — suppressed while feed-driven (possession follows the feed),
    // unless drivenFiller keeps them as harmless between-events action.
    if ((!world.driven || world.cfg.features?.drivenFiller === true) && maybeTriggerSlideTackle(world, player)) {
      updateSlideTackle(world, player, dt);
      continue;
    }

    // Keyboard-controlled player (sandbox) moves by held keys instead of AI.
    if (isControlled(world, player)) {
      updateControlledPlayer(world, player, dt);
      continue;
    }

    if (owner && owner.id === player.id) {
      const ratios = fieldRatios(size, player.x, player.y);
      const dribbleLat = clamp(ratios.lat + player.dir * 0.055, 0.06, 0.94);
      // smartAI carries the ball toward the top of the pitch (near the placares) so the whole play reads
      // high; legacy just drifts to the width center.
      const smart = world.cfg.features?.smartAI === true;
      const dribbleDepth = clamp(ratios.depth + ((smart ? 0.34 : 0.5) - ratios.depth) * (smart ? 0.14 : 0.04), 0.06, 0.88);
      const target = pointOnField(size, dribbleLat, dribbleDepth);
      moveToward(world, player, target.x, target.y, 150, dt);
      player.think -= dt;
      if (player.think <= 0) {
        player.think = 0.28 + Math.random() * 0.32;
        decideOwnerAction(world, player);
      }
      continue;
    }

    const chaser = player.team === Team.Blue ? blueChaser : redChaser;
    if (!owner && chaser && chaser.id === player.id) {
      moveToward(world, player, ball.x, ball.y, player.role === Role.GK ? 85 : 145, dt);
      continue;
    }
    if (owner && player.team !== owner.team && chaser && chaser.id === player.id) {
      moveToward(world, player, ball.x, ball.y, player.role === Role.GK ? 85 : 150, dt);
      continue;
    }

    if (shapeCtx) {
      player.isPresser = shapeCtx.presserIds.has(player.id);
      updateOffBallRun(world, player, shapeCtx, dt);
      updateMarking(world, player, shapeCtx, dt);
      const smart = smartSupportTarget(world, player, shapeCtx);
      // A committed off-ball run or a 2nd presser sprints; otherwise the normal support jog.
      const speed = player.role === Role.GK ? 75 : player.runKind !== RunKind.None || player.isPresser ? 150 : 126;
      moveToward(world, player, smart.x, smart.y, speed, dt);
      continue;
    }
    const target = supportTarget(world, player, possessionTeam);
    moveToward(world, player, target.x, target.y, player.role === Role.GK ? 75 : 126, dt);
  }

  // Soft body separation. Pushes are ACCUMULATED into a per-player delta and applied once, capped, at the
  // end — the old in-place version let a scrum on the ball compound many overlaps into one huge single-tick
  // shove (players "teleporting" around the ball). The cap keeps normal 1–2 overlaps identical while killing
  // that pathological pop; minDist scales with the pitch so spacing reads the same across courts.
  const minDist = 18 * (world.cfg.fieldScale / 1.5);
  const maxSeparation = 12 * (world.cfg.fieldScale / 1.5);
  const sepX = new Array<number>(players.length).fill(0);
  const sepY = new Array<number>(players.length).fill(0);
  for (let i = 0; i < players.length; i++) {
    if (players[i].celebrationPhase !== CelebrationPhase.None) continue;
    for (let j = i + 1; j < players.length; j++) {
      if (players[j].celebrationPhase !== CelebrationPhase.None) continue;
      const dx = players[j].x - players[i].x;
      const dy = players[j].y - players[i].y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < minDist) {
        const push = (minDist - d) * 0.5;
        const nx = dx / d;
        const ny = dy / d;
        sepX[i] -= nx * push;
        sepY[i] -= ny * push;
        sepX[j] += nx * push;
        sepY[j] += ny * push;
      }
    }
  }
  for (let i = 0; i < players.length; i++) {
    const mag = Math.hypot(sepX[i], sepY[i]);
    const scale = mag > maxSeparation ? maxSeparation / mag : 1;
    players[i].x += sepX[i] * scale;
    players[i].y += sepY[i] * scale;
  }
}
