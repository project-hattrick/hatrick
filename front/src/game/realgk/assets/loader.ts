import { BodyAnim } from '../enums';
import { BALL_FRAMES as V1_BALL_FRAMES, ballFramePath as v1BallFramePath } from '../../assets/manifest';
import { bodyFramePath, COACH_PATHS, COURT_BG, GOAL_PATHS, HEAD_PATHS, REF_SPRITE_PATHS, REF_WALK_FRAMES } from './manifest';
import { ITEMS, V4_ANIMS } from './items';

export type HeadKey = 'front' | 'frontClosed' | 'back' | 'side';

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
  goal: { back: HTMLImageElement; front: HTMLImageElement; shadow: HTMLImageElement };
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

/**
 * Resolves sprites (images start loading immediately; draws guard on `complete`).
 * The v4 anim pack is only fetched when `includeV4` — legacy/hero boots stay at the original request set.
 */
export function loadRealGkAssets(includeV4 = false): RealGkAssets {
  const body = Object.fromEntries(
    ITEMS.map((item) => [
      item.id,
      includeV4 || !V4_ANIMS.has(item.id) ? item.frames.map((name) => loadImage(bodyFramePath(name))) : [],
    ]),
  ) as Record<BodyAnim, HTMLImageElement[]>;

  return {
    court: loadImage(COURT_BG),
    body,
    ball: Array.from({ length: V1_BALL_FRAMES }, (_, i) => loadImage(v1BallFramePath(i))),
    heads: {
      front: loadImage(HEAD_PATHS.front),
      frontClosed: loadImage(HEAD_PATHS.frontClosed),
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
    goal: {
      back: includeV4 ? loadImage(GOAL_PATHS.back) : new Image(),
      front: includeV4 ? loadImage(GOAL_PATHS.front) : new Image(),
      shadow: includeV4 ? loadImage(GOAL_PATHS.shadow) : new Image(),
    },
  };
}
