import { GoalkeeperAnim, OutfieldAnim, Team } from '../enums';
import { makeAnimation } from './animation';
import {
  BALL_FRAMES,
  GOALKEEPER_SPECS,
  OUTFIELD_SPECS,
  ballFramePath,
  framePath,
  goalkeeperDir,
  outfieldDir,
} from './manifest';
import type { Animation, AssetManifest, GoalkeeperSet, OutfieldSet, SpriteSets } from './types';

const cache = new Map<string, HTMLImageElement>();

/** Loads (or returns cached) image. Decoding is async; callers guard on `complete`/`naturalWidth`. */
export function loadImage(src: string): HTMLImageElement {
  const hit = cache.get(src);
  if (hit) return hit;
  const im = new Image();
  im.src = src;
  cache.set(src, im);
  return im;
}

const frames = (dir: string, n: number): HTMLImageElement[] =>
  Array.from({ length: n }, (_, i) => loadImage(framePath(dir, i)));

function buildOutfieldSet(team: Team): OutfieldSet {
  const set = {} as OutfieldSet;
  for (const anim of Object.values(OutfieldAnim)) {
    const spec = OUTFIELD_SPECS[anim];
    set[anim] = makeAnimation(frames(outfieldDir(team, anim), spec.frames), spec);
  }
  return set;
}

function buildGoalkeeperSet(): GoalkeeperSet {
  const set = {} as GoalkeeperSet;
  for (const anim of Object.values(GoalkeeperAnim)) {
    const spec = GOALKEEPER_SPECS[anim];
    set[anim] = makeAnimation(frames(goalkeeperDir(anim), spec.frames), spec);
  }
  return set;
}

/** Resolves a checkpoint manifest into the full SpriteSets bundle (images start loading immediately). */
export function resolveAssets(manifest: AssetManifest): SpriteSets {
  return {
    stadium: loadImage(manifest.stadium),
    ball: Array.from({ length: BALL_FRAMES }, (_, i) => loadImage(ballFramePath(i))),
    outfield: {
      [Team.Blue]: buildOutfieldSet(Team.Blue),
      [Team.Red]: buildOutfieldSet(Team.Red),
    },
    goalkeeper: buildGoalkeeperSet(),
  };
}

export type { Animation };
