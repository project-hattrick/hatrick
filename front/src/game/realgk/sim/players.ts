import { BodyAnim, PlayerAction, Role, Team } from '../enums';
import { fieldBounds, fieldRatios, pointOnField } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';
import { ITEM_MAP } from '../assets/items';
import { ballOwner, kickBall, teamPlayers } from './ball';
import { FORMATION } from './formation';
import { maybeTriggerKeeperDive, updateKeeperDive } from './keeper';
import { Status } from './messages';
import { setStatus } from './rules';

const TEAM_TAG: Record<Team, string> = { [Team.Blue]: 'BLU', [Team.Red]: 'RED' };

/** (Re)spawns both 5-a-side squads into formation. */
export function resetPlayers(world: RealGkWorld): void {
  world.players = [];
  world.nextPlayerId = 1;
  for (const team of [Team.Blue, Team.Red]) {
    const dir = team === Team.Blue ? 1 : -1;
    FORMATION.forEach((slot, index) => {
      const lat = team === Team.Blue ? slot.lat : 1 - slot.lat;
      const pt = pointOnField(world.size, lat, slot.depth);
      const isGk = slot.role === Role.GK;
      const idle = isGk ? BodyAnim.GkIdle : dir > 0 ? BodyAnim.IdleFront : BodyAnim.IdleBack;
      world.players.push({
        id: world.nextPlayerId++,
        name: `${TEAM_TAG[team]}-${index + 1}`,
        team,
        dir,
        role: slot.role,
        homeLat: lat,
        homeDepth: slot.depth,
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
      });
    });
  }
}

export function nearestPlayerToBall(world: RealGkWorld, team: Team): RealGkPlayer {
  const { ball } = world;
  const roster = world.players.filter((p) => p.team === team);
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
    if (player.action === PlayerAction.Dive && player.actionTimer > 0) return BodyAnim.GkDive;
    if (speed < 12) return player.idleMode;
    if (Math.abs(dx) > Math.abs(dy) * 1.18 && Math.abs(dx) > 18) return BodyAnim.GkRunSide;
    return BodyAnim.GkShuffle;
  }
  if (speed < 24) return player.idleMode;
  if (Math.abs(dx) > Math.abs(dy) * 1.38 && Math.abs(dx) > 28) return BodyAnim.RunSide;
  if (dy < 0) return speed > 120 ? BodyAnim.RunBack : BodyAnim.WalkBack;
  return speed > 120 ? BodyAnim.RunFront : BodyAnim.WalkFront;
}

export function frameIndexFor(player: RealGkPlayer, now: number): number {
  const item = ITEM_MAP[player.mode];
  if (player.mode.startsWith('idle') || player.mode === BodyAnim.GkIdle) return 0;
  if (!item) return 0;
  if (player.mode === BodyAnim.GkDive) return Math.min(item.frames.length - 1, Math.floor(player.actionElapsed * item.fps));
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

/** Steers a player toward (tx,ty) with arrival easing, clamps to pitch, and resolves the body mode. */
export function moveToward(world: RealGkWorld, player: RealGkPlayer, tx: number, ty: number, topSpeed: number, dt: number): void {
  if (player.role === Role.GK) {
    player.saveCooldown = Math.max(0, player.saveCooldown - dt);
    if (updateKeeperDive(player, dt)) return;
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
  const bounds = fieldBounds(world.size, player.y);
  player.y = clamp(player.y, bounds.topY + 4, bounds.bottomY - 8);
  player.x = clamp(player.x, bounds.left + 12, bounds.right - 12);
  updateFacingGuard(player, dt);

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

function supportTarget(world: RealGkWorld, player: RealGkPlayer, possessionTeam: Team | null) {
  const { ball, size } = world;
  const ballRatio = fieldRatios(size, ball.x, ball.y);
  const attacking = possessionTeam === player.team;
  const press = possessionTeam && possessionTeam !== player.team;

  let lat = player.homeLat;
  let depth = player.homeDepth;

  if (player.role === Role.GK) {
    lat = player.team === Team.Blue ? 0.05 : 0.95;
    depth = clamp(ballRatio.depth, 0.34, 0.66);
  } else if (attacking) {
    lat = clamp(player.homeLat + player.dir * 0.06 + (ballRatio.lat - 0.5) * 0.18, 0.06, 0.94);
    depth = clamp(player.homeDepth + (ballRatio.depth - player.homeDepth) * 0.42, 0.14, 0.86);
  } else if (press) {
    lat = clamp(player.homeLat + (ballRatio.lat - player.homeLat) * 0.16, 0.05, 0.95);
    depth = clamp(player.homeDepth + (ballRatio.depth - player.homeDepth) * 0.25, 0.12, 0.88);
  } else {
    lat = clamp(player.homeLat, 0.05, 0.95);
    depth = clamp(player.homeDepth, 0.12, 0.88);
  }
  return pointOnField(size, lat, depth);
}

function decideOwnerAction(world: RealGkWorld, owner: RealGkPlayer): void {
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

  if (distToGoal < 180) {
    kickBall(world, owner, goalPoint.x, goalPoint.y, 405, false);
    const note = Status.shot(owner.name);
    setStatus(world, note.title, note.text);
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

/** Orients every player (except the ball carrier / diving keeper) to watch the ball. */
export function faceBall(world: RealGkWorld): void {
  const { players, ball } = world;
  for (const p of players) {
    if (ball.ownerId === p.id) continue;
    if (p.role === Role.GK) continue;
    const dx = ball.x - p.x;
    const dy = ball.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    p.lookX = dx / len;
    p.lookY = dy / len;
    p.desiredLookX = p.lookX;
    p.desiredLookY = p.lookY;
    p.facing = dx < 0 ? -1 : 1;
    if (Math.abs(dy) >= Math.abs(dx)) {
      p.idleMode = dy < 0 ? BodyAnim.IdleBack : BodyAnim.IdleFront;
    }
  }
}

/** Per-player AI + soft body separation for one tick. */
export function updatePlayers(world: RealGkWorld, dt: number): void {
  const { players, ball, match, size } = world;
  const owner = ballOwner(world);
  const possessionTeam = owner ? owner.team : null;
  const blueChaser = nearestPlayerToBall(world, Team.Blue);
  const redChaser = nearestPlayerToBall(world, Team.Red);

  for (const player of players) {
    if (match.celebration > 0) {
      const pt = pointOnField(size, player.homeLat, player.homeDepth);
      moveToward(world, player, pt.x, pt.y, player.role === Role.GK ? 70 : 110, dt);
      continue;
    }

    if (player.role === Role.GK && maybeTriggerKeeperDive(world, player)) {
      updateKeeperDive(player, dt);
      continue;
    }

    if (owner && owner.id === player.id) {
      const ratios = fieldRatios(size, player.x, player.y);
      const dribbleLat = clamp(ratios.lat + player.dir * 0.055, 0.06, 0.94);
      const dribbleDepth = clamp(ratios.depth + (0.5 - ratios.depth) * 0.04, 0.12, 0.88);
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
    if (!owner && chaser.id === player.id) {
      moveToward(world, player, ball.x, ball.y, player.role === Role.GK ? 85 : 145, dt);
      continue;
    }
    if (owner && player.team !== owner.team && chaser.id === player.id) {
      moveToward(world, player, ball.x, ball.y, player.role === Role.GK ? 85 : 150, dt);
      continue;
    }

    const target = supportTarget(world, player, possessionTeam);
    moveToward(world, player, target.x, target.y, player.role === Role.GK ? 75 : 126, dt);
  }

  for (const player of players) {
    for (const other of players) {
      if (player.id >= other.id) continue;
      const dx = other.x - player.x;
      const dy = other.y - player.y;
      const d = Math.hypot(dx, dy);
      const minDist = 18;
      if (d > 0 && d < minDist) {
        const push = (minDist - d) * 0.5;
        const nx = dx / d;
        const ny = dy / d;
        player.x -= nx * push;
        player.y -= ny * push;
        other.x += nx * push;
        other.y += ny * push;
      }
    }
  }
}
