import { BodyAnim } from '../enums';
import { BALL_FRAMES as V1_BALL_FRAMES, ballFramePath as v1BallFramePath } from '../../assets/manifest';
import { bodyFramePath, COACH_PATHS, COURT_BG, HEAD_PATHS, REF_SPRITE_PATHS, REF_WALK_FRAMES } from './manifest';
import { ITEMS } from './items';

export type HeadKey = 'front' | 'back' | 'side';

export interface RefereeSprites {
  idleFront: HTMLImageElement;
  idleQuarter: HTMLImageElement;
  idleSide: HTMLImageElement;
  redFront: HTMLImageElement;
  redQuarter: HTMLImageElement;
  walkSide: HTMLImageElement[];
}

export interface RealGkAssets {
  court: HTMLImageElement;
  body: Record<BodyAnim, HTMLImageElement[]>;
  ball: HTMLImageElement[];
  heads: Record<HeadKey, HTMLImageElement>;
  ref: RefereeSprites;
  coach: { idle: HTMLImageElement; angry: HTMLImageElement };
}

const cache = new Map<string, HTMLImageElement>();

function loadImage(src: string): HTMLImageElement {
  const hit = cache.get(src);
  if (hit) return hit;
  const img = new Image();
  img.src = src;
  cache.set(src, img);
  return img;
}

/** Resolves every v2 sprite (images start loading immediately; draws guard on `complete`). */
export function loadRealGkAssets(): RealGkAssets {
  const body = Object.fromEntries(
    ITEMS.map((item) => [item.id, item.frames.map((name) => loadImage(bodyFramePath(name)))]),
  ) as Record<BodyAnim, HTMLImageElement[]>;

  return {
    court: loadImage(COURT_BG),
    body,
    ball: Array.from({ length: V1_BALL_FRAMES }, (_, i) => loadImage(v1BallFramePath(i))),
    heads: {
      front: loadImage(HEAD_PATHS.front),
      back: loadImage(HEAD_PATHS.back),
      side: loadImage(HEAD_PATHS.side),
    },
    ref: {
      idleFront: loadImage(REF_SPRITE_PATHS.idleFront),
      idleQuarter: loadImage(REF_SPRITE_PATHS.idleQuarter),
      idleSide: loadImage(REF_SPRITE_PATHS.idleSide),
      redFront: loadImage(REF_SPRITE_PATHS.redFront),
      redQuarter: loadImage(REF_SPRITE_PATHS.redQuarter),
      walkSide: REF_WALK_FRAMES.map((src) => loadImage(src)),
    },
    coach: {
      idle: loadImage(COACH_PATHS.idle),
      angry: loadImage(COACH_PATHS.angry),
    },
  };
}
