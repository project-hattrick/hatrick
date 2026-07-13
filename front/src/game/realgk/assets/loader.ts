import { BodyAnim } from '../enums';
import { BALL_FRAMES as V1_BALL_FRAMES, ballFramePath as v1BallFramePath } from './v1-ball';
import {
  bodyFramePath,
  COACH_PATHS,
  COURT_BG,
  GOAL_PATHS,
  HEAD_PATHS,
  PERSONA_BODY_ANIMS,
  PERSONA_COUNT,
  PERSONA_GK_BODY_ANIMS,
  personaBodyFrames,
  personaHeadPaths,
  REF_SPRITE_PATHS,
  REF_WALK_FRAMES,
} from './manifest';
import { ITEMS, V4_ANIMS } from './items';

export type HeadKey = 'front' | 'frontClosed' | 'back' | 'side';

export type HeadSet = Record<HeadKey, HTMLImageElement>;

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
  heads: HeadSet;
  ref: RefereeSprites;
  coach: { idle: HTMLImageElement; angry: HTMLImageElement };
  goal: { back: HTMLImageElement; front: HTMLImageElement; shadow: HTMLImageElement };
  /** Per-persona head sets (casting, `features.personaHeads`). Empty unless persona bodies are loaded. */
  personaHeads: HeadSet[];
  /** Headless outfield locomotion bodies per anim (casting). Empty unless persona bodies are loaded. */
  personaBodies: Partial<Record<BodyAnim, HTMLImageElement[]>>;
  /** Optional second body pack for the away team (Team.Red). Empty unless a home/away split root is set. */
  personaBodiesAway: Partial<Record<BodyAnim, HTMLImageElement[]>>;
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
const versionedPath = (path: string, version?: string): string => (version ? `${path}?v=${encodeURIComponent(version)}` : path);

export function loadRealGkAssets(
  includeV4 = false,
  includePersonas = false,
  personaBodyRoot?: string,
  courtImage?: string,
  assetVersion?: string,
  awayBodyRoot?: string,
  awayAssetVersion?: string,
): RealGkAssets {
  const body = Object.fromEntries(
    ITEMS.map((item) => [
      item.id,
      includeV4 || !V4_ANIMS.has(item.id) ? item.frames.map((name) => loadImage(bodyFramePath(name))) : [],
    ]),
  ) as Record<BodyAnim, HTMLImageElement[]>;

  const personaHeads: HeadSet[] = includePersonas
    ? Array.from({ length: PERSONA_COUNT }, (_, i) => {
        const p = personaHeadPaths(i);
        const front = loadImage(p.front);
        return { front, frontClosed: front, back: loadImage(p.back), side: loadImage(p.side) };
      })
    : [];
  // Team-specific keeper bodies only exist in custom family roots (e.g. /game/franca) — the default
  // personas pack has none, so skipping GK anims there avoids a wall of 404s.
  const loadBodyPack = (root: string | undefined, version: string | undefined, includeGk: boolean): Partial<Record<BodyAnim, HTMLImageElement[]>> => {
    const pack: Partial<Record<BodyAnim, HTMLImageElement[]>> = {};
    const anims = includeGk ? [...PERSONA_BODY_ANIMS, ...PERSONA_GK_BODY_ANIMS] : PERSONA_BODY_ANIMS;
    for (const anim of anims) {
      const frameCount = ITEMS.find((item) => item.id === anim)?.frameCount ?? 4;
      pack[anim as BodyAnim] = personaBodyFrames(anim, root, frameCount, version).map((src) => loadImage(src));
    }
    return pack;
  };
  const personaBodies = includePersonas ? loadBodyPack(personaBodyRoot, assetVersion, !!personaBodyRoot) : {};
  // Away pack (Team.Red) — a recolored family root like /game/teams/netherlands ships GK cuts too.
  const personaBodiesAway = includePersonas && awayBodyRoot ? loadBodyPack(awayBodyRoot, awayAssetVersion, true) : {};

  return {
    court: loadImage(versionedPath(courtImage ?? COURT_BG, assetVersion)),
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
    personaHeads,
    personaBodies,
    personaBodiesAway,
  };
}
