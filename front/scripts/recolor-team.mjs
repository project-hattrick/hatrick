// Batch team recolor — ports the sprite-recolor-lab algorithm (soft hue+sat masks, no hard classification)
// to generate a full kit pack from the France source body.
//
//   node scripts/recolor-team.mjs <team> [method]
//   method = hue (default) | colorize | gradient | multiply | hybrid
//
// Reads every top-level PNG in public/game/franca/players and writes the recolored frame
// to public/game/teams/<team>/players/<same-name>.png (filenames preserved so the engine's
// personaBodyFrames(`${root}/players/${anim}_frame_NN.png`) resolves against the new root).

import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(FRONT, 'public', 'game', 'franca', 'players');

// hex -> [r,g,b]
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// Kit = which target color each France source band becomes.
//   navy band  -> shirt/gloves ; white band -> shorts/whites ; red band -> socks/red trim
const TEAMS = {
  // World Cup final-stage teams. France is the source pack (native, not recolored).
  brazil:      { name: 'Brazil',      shirt: hx('#f4d000'), shorts: hx('#1b3fae'), socks: hx('#eef2f7'), split: true },
  argentina:   { name: 'Argentina',   shirt: hx('#84b9e3'), shorts: hx('#0b1230'), socks: hx('#eef2f7'), split: true },
  spain:       { name: 'Spain',       shirt: hx('#c60b1e'), shorts: hx('#1a2456'), socks: hx('#c60b1e'), split: true },
  norway:      { name: 'Norway',      shirt: hx('#ba0c2f'), shorts: hx('#ffffff'), socks: hx('#001e50'), split: false },
  england:     { name: 'England',     shirt: hx('#f2f4f8'), shorts: hx('#002366'), socks: hx('#eef2f7'), split: false },
  switzerland: { name: 'Switzerland', shirt: hx('#d52b1e'), shorts: hx('#ffffff'), socks: hx('#d52b1e'), split: false },
  netherlands: { name: 'Netherlands', shirt: hx('#f36c21'), shorts: hx('#ffffff'), socks: hx('#f36c21'), split: false },
  canada:      { name: 'Canada',      shirt: hx('#d52b1e'), shorts: hx('#ffffff'), socks: hx('#d52b1e'), split: false },
};

// ---- detection / shading params (match the sandbox defaults) ----
const P = { satMin: 0.22, satFeather: 0.12, hueW: 30, feather: 22, olThr: 52, navyLmax: 85, navyC: 224, redC: 353, spread: 0.42, hilite: 0.34, ysplit: 0.52 };

// ---- color helpers ----
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0, l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
function hue2rgb(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
function hsl2rgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
}
const circDist = (a, b) => { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

function weights(r, g, b) {
  const mx = Math.max(r, g, b), L = lum(r, g, b), [h, s, l] = rgb2hsl(r, g, b);
  const dark = smooth((mx - P.olThr) / 12);
  const sat = smooth((s - P.satMin) / P.satFeather);
  const hm = (ctr) => { const d = circDist(h, ctr); return d <= P.hueW ? 1 : d >= P.hueW + P.feather ? 0 : 1 - (d - P.hueW) / P.feather; };
  // navy shirt is dark; bright blue accents (shorts trim, bluish white-fold shadows) share its hue but sit higher
  // in luminance — gate them out so they don't inflate the navy range or speckle the shorts.
  const navyDark = smooth((P.navyLmax - L) / 15);
  const wNavy = hm(P.navyC) * sat * dark * navyDark;
  const wRed = hm(P.redC) * sat * dark;
  // In the France source every LIGHT region is kit white (shorts / shoes / trim) and every dark region is
  // shirt-navy or sock-red (separated by hue). So "light → white band" with no saturation gate — this also
  // sweeps up the bluish fold shadows that used to fall between the gates and stay unrecolored (speckle).
  const light = smooth((L - 140) / 50);
  const wWhite = light * dark;
  return { wNavy, wRed, wWhite, h, s, l, L };
}

function apply(method, T, px, range) {
  const [Th, Ts] = rgb2hsl(T[0], T[1], T[2]);
  const t = Math.max(0, Math.min(1, (px.L - range[0]) / Math.max(1, range[1] - range[0])));
  if (method === 'hue') { const newS = px.s + (Ts - px.s) * (1 - Math.min(1, px.s / 0.35)); return hsl2rgb(Th, newS, px.l); }
  if (method === 'colorize') return hsl2rgb(Th, Ts, px.l);
  if (method === 'multiply') { const g = 0.4 + 0.75 * Math.pow(t, 0.85); return [T[0] * g, T[1] * g, T[2] * g]; }
  const sh = mix(T, [0, 0, 0], P.spread), li = mix(T, [255, 255, 255], P.hilite);
  return t < 0.5 ? mix(sh, T, t * 2) : mix(T, li, (t - 0.5) * 2);
}

function bandRanges(data, w, h) {
  const R = { navy: [255, 0], red: [255, 0], white: [255, 0] };
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 40) continue;
    const wt = weights(data[i], data[i + 1], data[i + 2]);
    const upd = (k, ww) => { if (ww > 0.5) { if (wt.L < R[k][0]) R[k][0] = wt.L; if (wt.L > R[k][1]) R[k][1] = wt.L; } };
    upd('navy', wt.wNavy); upd('red', wt.wRed); upd('white', wt.wWhite);
  }
  for (const k in R) { if (R[k][0] > R[k][1]) R[k] = [0, 255]; if (R[k][1] - R[k][0] < 8) R[k] = [Math.max(0, R[k][0] - 8), Math.min(255, R[k][1] + 8)]; }
  return R;
}

function recolorBuffer(data, w, h, kit, method) {
  const ranges = bandRanges(data, w, h);
  const chromatic = (T) => (lum(T[0], T[1], T[2]) > 120 ? 'gradient' : 'hue');
  const shirtM = method === 'hybrid' ? chromatic(kit.shirt) : method;
  const sockM = method === 'hybrid' ? chromatic(kit.socks) : method;
  // The white band is flat + bright, so gradient dumps every pixel at its highlight end (washed-out pale).
  // Multiply anchors to the target color instead: white→blue reads as solid blue, white→white stays white.
  const whiteM = method === 'hybrid' ? 'multiply' : method;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]; if (a < 20) { data[i + 3] = 0; continue; }
    const r = data[i], g = data[i + 1], b = data[i + 2], wt = weights(r, g, b);
    let col = [r, g, b];
    let whiteT = kit.shorts;
    if (kit.split) { const y = (i / 4 / w); whiteT = y < P.ysplit * h ? kit.shirt : kit.shorts; }
    col = mix(col, apply(shirtM, kit.shirt, wt, ranges.navy), wt.wNavy);
    col = mix(col, apply(sockM, kit.socks, wt, ranges.red), wt.wRed);
    col = mix(col, apply(whiteM, whiteT, wt, ranges.white), wt.wWhite);
    data[i] = clamp(col[0]); data[i + 1] = clamp(col[1]); data[i + 2] = clamp(col[2]);
  }
  return data;
}

async function main() {
  const team = (process.argv[2] || 'netherlands').toLowerCase();
  const method = (process.argv[3] || 'hue').toLowerCase();
  const kit = TEAMS[team];
  if (!kit) { console.error(`Unknown team "${team}". Known: ${Object.keys(TEAMS).join(', ')}`); process.exit(1); }
  const OUT_DIR = path.join(FRONT, 'public', 'game', 'teams', team, 'players');
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(SRC_DIR)).filter((f) => f.toLowerCase().endsWith('.png'));
  console.log(`Recoloring ${files.length} frames  ${kit.name}  method=${method}`);
  console.log(`  ${SRC_DIR}\n  -> ${OUT_DIR}`);
  let done = 0;
  for (const f of files) {
    const { data, info } = await sharp(path.join(SRC_DIR, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    recolorBuffer(data, info.width, info.height, kit, method);
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(path.join(OUT_DIR, f));
    done++;
    if (done % 20 === 0 || done === files.length) console.log(`  ${done}/${files.length}`);
  }
  console.log(`Done. ${done} frames -> /game/teams/${team}/players/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
