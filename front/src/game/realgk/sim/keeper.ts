import { DIVE_DURATION, DIVE_FORWARD, DIVE_LIFT } from '../constants';
import { BodyAnim, HeadView, PlayerAction, Role, Team } from '../enums';
import { goalCenterForTeam } from '../field';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp, easeOutCubic, lerp } from '../util';
import { KEEPER_FRAME_CONFIG, type FrameCfg } from '../assets/configs';

const DEFAULT_CFG: FrameCfg = { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 };

export function keeperConfigFor(mode: BodyAnim, frameIdx: number): FrameCfg {
  const frames = KEEPER_FRAME_CONFIG[mode];
  if (!frames || !frames.length) return DEFAULT_CFG;
  return frames[Math.max(0, Math.min(frameIdx, frames.length - 1))];
}

export function startKeeperDive(player: RealGkPlayer, dir: number, targetX: number, targetY: number): boolean {
  if (player.role !== Role.GK || player.actionTimer > 0 || player.saveCooldown > 0) return false;
  player.action = PlayerAction.Dive;
  player.actionTimer = DIVE_DURATION;
  player.actionElapsed = 0;
  player.diveStartX = player.x;
  player.diveStartY = player.y;
  player.diveDir = dir || player.facing || player.dir;
  player.targetX = targetX;
  player.targetY = targetY;
  player.facing = player.diveDir < 0 ? -1 : 1;
  player.lookX = player.facing;
  player.lookY = 0;
  player.mode = BodyAnim.GkDive;
  player.modeLock = DIVE_DURATION;
  return true;
}

export function updateKeeperDive(player: RealGkPlayer, dt: number): boolean {
  if (player.action !== PlayerAction.Dive || player.actionTimer <= 0) return false;
  player.actionTimer = Math.max(0, player.actionTimer - dt);
  player.actionElapsed += dt;
  const t = clamp(player.actionElapsed / DIVE_DURATION, 0, 1);
  const forward = lerp(0, DIVE_FORWARD, easeOutCubic(t));
  const lift = Math.sin(t * Math.PI) * DIVE_LIFT;
  const settleY = (player.targetY - player.diveStartY) * t * 0.35;
  player.x = player.diveStartX + forward * player.diveDir;
  player.y = player.diveStartY - lift + settleY;
  player.vx = 0;
  player.vy = 0;
  if (player.actionTimer <= 0) {
    player.action = PlayerAction.None;
    player.saveCooldown = 0.55;
    player.mode = BodyAnim.GkIdle;
  }
  return true;
}

export function maybeTriggerKeeperDive(world: RealGkWorld, player: RealGkPlayer): boolean {
  const { ball, size } = world;
  if (player.role !== Role.GK || player.actionTimer > 0 || player.saveCooldown > 0 || ball.ownerId || ball.z > 32) {
    return false;
  }
  const goalCenter = goalCenterForTeam(size, player.team);
  const towardGoal = player.team === Team.Blue ? ball.vx < -80 : ball.vx > 80;
  const closeLane = Math.abs(ball.y - goalCenter.y) < 82;
  const approachingKeeper = Math.abs(ball.x - player.x) < 150;
  if (!towardGoal || !closeLane || !approachingKeeper) return false;

  const lead = clamp(0.1 + Math.abs(ball.vx) / 900, 0.1, 0.2);
  const targetX = ball.x + ball.vx * lead;
  const targetY = ball.y + ball.vy * lead;
  if (Math.abs(targetY - player.y) > 54) return false;

  // Only dash toward the pitch — never backward into the keeper's own goal.
  return startKeeperDive(player, player.dir, targetX, targetY);
}
