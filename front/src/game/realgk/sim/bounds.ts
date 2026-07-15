import { fieldBounds } from '../field';
import { Role } from '../enums';
import type { RealGkPlayer, RealGkWorld } from '../types';
import { clamp } from '../util';

/** Keeps actors inside the calibrated playable trapezoid after dives, tackles, and separation pushes. */
export function clampPlayerToPitch(world: RealGkWorld, player: RealGkPlayer, inset = 12): void {
  const bounds = fieldBounds(world.size, player.y);
  const topInset = Math.max(4, inset * 0.35);
  const bottomInset = Math.max(8, inset * 0.65);
  player.y = clamp(player.y, bounds.topY + topInset, bounds.bottomY - bottomInset);
  const yBounds = fieldBounds(world.size, player.y);
  player.x = clamp(player.x, yBounds.left + inset, yBounds.right - inset);
}

export function clampPlayersToPitch(world: RealGkWorld): void {
  for (const player of world.players) clampPlayerToPitch(world, player, player.role === Role.GK ? 10 : 12);
}
