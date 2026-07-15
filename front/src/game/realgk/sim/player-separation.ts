import { CelebrationPhase } from '../enums';
import type { RealGkWorld } from '../types';
import { clampPlayersToPitch } from './bounds';

export function applyPlayerSeparation(world: RealGkWorld): void {
  const { players } = world;
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
      if (d <= 0 || d >= minDist) continue;
      const push = (minDist - d) * 0.5;
      const nx = dx / d;
      const ny = dy / d;
      sepX[i] -= nx * push;
      sepY[i] -= ny * push;
      sepX[j] += nx * push;
      sepY[j] += ny * push;
    }
  }

  for (let i = 0; i < players.length; i++) {
    const mag = Math.hypot(sepX[i], sepY[i]);
    const scale = mag > maxSeparation ? maxSeparation / mag : 1;
    players[i].x += sepX[i] * scale;
    players[i].y += sepY[i] * scale;
  }
  clampPlayersToPitch(world);
}
