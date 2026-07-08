// Turn the POC's SkillCorner match (window.MATCH in match_real.js) into a clean
// app asset: 11+11 players (nulls filled with an invented plausible position,
// like the POC), key-moment markers (ball near a goal), served from public/.
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'C:/Users/kauam/Documents/Codex/2026-06-25/tenh/outputs/futebol_25d_sprites/assets/match_real.js';
const OUT_DIR = new URL('../public/game/tracking/', import.meta.url);
const OUT = new URL('./aleague.json', OUT_DIR);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const raw = fs.readFileSync(SRC, 'utf8');
const M = JSON.parse(raw.slice(raw.indexOf('=') + 1).replace(/;\s*$/, ''));
console.log(`source: ${M.home} ${M.score[0]}-${M.score[1]} ${M.away} · ${M.frames.length} frames @ ${M.fps}fps`);

// Per-slot mean role position (slots 0..10) over frames where the slot is tracked.
const meanOf = (key) => {
  const acc = Array.from({ length: 11 }, () => ({ x: 0, y: 0, n: 0 }));
  for (const f of M.frames)
    for (let s = 0; s < 11; s++) {
      const p = f[key][s];
      if (p) { acc[s].x += p[0]; acc[s].y += p[1]; acc[s].n++; }
    }
  return acc.map((a) => (a.n ? [a.x / a.n, a.y / a.n] : [0.5, 0.5]));
};
const mH = meanOf('h');
const mA = meanOf('a');

const fill = (arr, mean, b) =>
  Array.from({ length: 11 }, (_, s) =>
    arr[s]
      ? [arr[s][0], arr[s][1]]
      : [clamp(mean[s][0] + (b[0] - 0.5) * 0.2, 0, 1), clamp(mean[s][1] + (b[1] - 0.5) * 0.15, 0, 1)],
  );

const frames = M.frames.map((f) => ({
  t: Math.round(f.t * 100) / 100,
  b: [f.b[0], f.b[1], Math.max(0, f.b[2] ?? 0)],
  h: fill(f.h, mH, f.b),
  a: fill(f.a, mA, f.b),
}));

// Key moments: cluster frames where the ball sits in a goal zone.
const key = [];
let openT = null;
let side = null;
let lastNear = -99;
for (const f of frames) {
  const nearR = f.b[0] > 0.955;
  const nearL = f.b[0] < 0.045;
  const inY = f.b[1] > 0.33 && f.b[1] < 0.67;
  if ((nearR || nearL) && inY) {
    if (openT === null || f.t - lastNear > 6) {
      if (openT !== null) key.push({ t: openT, label: `Chance · ${side} goal` });
      openT = f.t;
      side = nearR ? 'right' : 'left';
    }
    lastNear = f.t;
  }
}
if (openT !== null) key.push({ t: openT, label: `Chance · ${side} goal` });
const keyMoments = key.slice(0, 16);

fs.mkdirSync(OUT_DIR, { recursive: true });
const out = { fps: M.fps, home: M.home, away: M.away, score: M.score, duration: frames[frames.length - 1].t, frames, keyMoments };
fs.writeFileSync(OUT, JSON.stringify(out));
const mb = (fs.statSync(OUT).size / 1e6).toFixed(1);
console.log(`wrote ${path.basename(OUT.pathname)} — ${frames.length} frames, ${keyMoments.length} markers, ${mb}MB`);
console.log('markers:', keyMoments.map((k) => `${Math.floor(k.t / 60)}:${String(Math.floor(k.t % 60)).padStart(2, '0')}`).join(', '));
