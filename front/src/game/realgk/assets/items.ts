import { BodyAnim } from '../enums';
import { pad2 } from '../util';

export type Bbox = [number, number, number, number];

interface RawItem {
  id: BodyAnim;
  fps: number;
  frameCount: number;
  loop?: boolean;
  /** Per-frame trim boxes; omitted = draw the whole frame (v4 anims ship pre-framed). */
  bboxes?: Bbox[];
}

/** Body-animation defs ported verbatim (fps + per-frame trim bboxes). Frame names are deterministic. */
const RAW: RawItem[] = [
  { id: BodyAnim.IdleBack, fps: 2.4, frameCount: 4, bboxes: [[71, 64, 407, 644], [3, 64, 339, 645], [70, 4, 407, 585], [3, 3, 339, 586]] },
  { id: BodyAnim.WalkBack, fps: 4.5, frameCount: 4, bboxes: [[72, 62, 427, 652], [11, 62, 366, 652], [82, 3, 433, 590], [3, 3, 354, 590]] },
  { id: BodyAnim.RunBack, fps: 7.2, frameCount: 4, bboxes: [[77, 61, 422, 681], [4, 62, 350, 699], [87, 4, 431, 655], [3, 3, 338, 637]] },
  { id: BodyAnim.IdleFront, fps: 2.4, frameCount: 4, bboxes: [[48, 41, 392, 601], [3, 41, 346, 601], [48, 3, 392, 562], [3, 3, 346, 562]] },
  { id: BodyAnim.WalkFront, fps: 4.5, frameCount: 4, bboxes: [[73, 69, 413, 614], [3, 69, 343, 614], [73, 3, 413, 548], [3, 3, 343, 548]] },
  { id: BodyAnim.RunFront, fps: 7.2, frameCount: 4, bboxes: [[99, 49, 458, 664], [18, 38, 370, 671], [83, 3, 443, 631], [3, 12, 355, 625]] },
  { id: BodyAnim.RunSide, fps: 7.2, frameCount: 4, bboxes: [[98, 62, 370, 613], [3, 70, 335, 591], [129, 3, 387, 519], [15, 10, 320, 528]] },
  // Idle now uses the light-save stance (pre-trimmed, drawn whole) instead of the old green sheet — no bboxes.
  { id: BodyAnim.GkIdle, fps: 2.2, frameCount: 4 },
  { id: BodyAnim.GkReady, fps: 4.4, frameCount: 4, bboxes: [[209, 135, 467, 455], [154, 136, 409, 455], [195, 89, 451, 411], [133, 96, 407, 406]] },
  { id: BodyAnim.GkShuffle, fps: 6.0, frameCount: 4, bboxes: [[225, 145, 471, 461], [142, 145, 390, 461], [204, 69, 462, 387], [152, 74, 415, 387]] },
  {
    id: BodyAnim.GkRunSide,
    fps: 10.5,
    frameCount: 8,
    bboxes: [[112, 106, 347, 349], [69, 111, 315, 352], [77, 112, 258, 351], [32, 112, 271, 352], [112, 64, 347, 307], [63, 64, 291, 288], [94, 57, 255, 300], [16, 55, 265, 294]],
  },
  {
    id: BodyAnim.GkDive,
    fps: 11.0,
    frameCount: 8,
    loop: false,
    bboxes: [[142, 123, 354, 332], [56, 131, 512, 337], [0, 133, 398, 300], [1, 182, 441, 285], [83, 104, 451, 273], [58, 148, 389, 283], [65, 147, 357, 280], [74, 120, 327, 283]],
  },
  // v6 dive pack (candidate_01, approved in the dive-candidates editor). Frames ship pre-trimmed;
  // bboxes are the full frame dims. Index timing is the non-uniform DIVE2_TIMELINE, not this fps.
  {
    id: BodyAnim.GkDiveV2,
    fps: 11.0,
    frameCount: 8,
    loop: false,
    bboxes: [[0, 0, 65, 82], [0, 0, 82, 84], [0, 0, 296, 90], [0, 0, 318, 61], [0, 0, 260, 139], [0, 0, 231, 105], [0, 0, 214, 121], [0, 0, 187, 120]],
  },
  // Light save (headless 3/4-front reflex block) — pre-trimmed, drawn whole (no bbox), head composited.
  { id: BodyAnim.GkLightSave, fps: 7.0, frameCount: 4, loop: false },
  // v4 pack — timings ported from the assets playground.
  { id: BodyAnim.TurnSide, fps: 8.0, frameCount: 4, loop: false },
  { id: BodyAnim.StopBrake, fps: 8.0, frameCount: 4, loop: false },
  { id: BodyAnim.ArmsUpRun, fps: 7.2, frameCount: 4 },
  { id: BodyAnim.HeaderFront, fps: 8.0, frameCount: 4, loop: false },
  { id: BodyAnim.ReceiveFront, fps: 7.4, frameCount: 4, loop: false },
  { id: BodyAnim.InterceptFront, fps: 8.0, frameCount: 4, loop: false },
  { id: BodyAnim.PowerShotFront, fps: 7.7, frameCount: 4, loop: false },
  { id: BodyAnim.PowerShotBack, fps: 7.7, frameCount: 4, loop: false },
  { id: BodyAnim.PowerShotSide, fps: 8.3, frameCount: 6, loop: false },
  { id: BodyAnim.SlideTackle, fps: 9.0, frameCount: 6, loop: false },
  { id: BodyAnim.ShotFront, fps: 7.7, frameCount: 4, loop: false },
  { id: BodyAnim.ShotBack, fps: 7.7, frameCount: 4, loop: false },
  { id: BodyAnim.CelebrateJump, fps: 8.4, frameCount: 6, loop: false },
  { id: BodyAnim.KneeSlide, fps: 7.8, frameCount: 6, loop: false },
  { id: BodyAnim.KneeRise, fps: 6.0, frameCount: 3, loop: false },
  { id: BodyAnim.KneeJump, fps: 7.2, frameCount: 4, loop: false },
];

export interface BodyItem {
  id: BodyAnim;
  fps: number;
  frameCount: number;
  loop: boolean;
  frames: string[];
  bboxes: Bbox[];
}

export const ITEMS: BodyItem[] = RAW.map((r) => ({
  id: r.id,
  fps: r.fps,
  frameCount: r.frameCount,
  loop: r.loop ?? true,
  bboxes: r.bboxes ?? [],
  frames: Array.from({ length: r.frameCount }, (_, i) => `${r.id}_frame_${pad2(i + 1)}.png`),
}));

export const ITEM_MAP = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<BodyAnim, BodyItem>;

/** Feature-gated anims (v4 packs + v6 dive) — only these need loading when features are enabled. */
export const V4_ANIMS = new Set<BodyAnim>([
  BodyAnim.GkDiveV2,
  BodyAnim.TurnSide,
  BodyAnim.StopBrake,
  BodyAnim.ArmsUpRun,
  BodyAnim.HeaderFront,
  BodyAnim.ReceiveFront,
  BodyAnim.InterceptFront,
  BodyAnim.PowerShotFront,
  BodyAnim.PowerShotBack,
  BodyAnim.PowerShotSide,
  BodyAnim.SlideTackle,
  BodyAnim.ShotFront,
  BodyAnim.ShotBack,
  BodyAnim.CelebrateJump,
  BodyAnim.KneeSlide,
  BodyAnim.KneeRise,
  BodyAnim.KneeJump,
]);
