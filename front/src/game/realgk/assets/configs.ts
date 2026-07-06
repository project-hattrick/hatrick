import { BodyAnim, CelebrationPhase, HeadView } from '../enums';

/** Per-frame head placement (body/head scale + offset ratios), ported verbatim. */
export interface FrameCfg {
  headView: HeadView;
  bodyScale: number;
  headScale: number;
  offsetXRatio: number;
  offsetYRatio: number;
  /** Optional per-frame size multiplier (edited in /sandbox/sprite-editor). Undefined = 1 = unchanged. */
  sizeScale?: number;
  /** Optional: mirror the head horizontally (flip the look direction). Undefined = false. */
  headFlip?: boolean;
}

const repeat = (cfg: FrameCfg, n: number): FrameCfg[] => Array.from({ length: n }, () => cfg);

export const KEEPER_FRAME_CONFIG: Partial<Record<BodyAnim, FrameCfg[]>> = {
  // Idle = light-save block stance (front 3/4), same head seating as GkLightSave.
  [BodyAnim.GkIdle]: repeat({ headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 }, 4),
  [BodyAnim.GkReady]: repeat({ headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0, offsetYRatio: 0.14 }, 4),
  [BodyAnim.GkShuffle]: repeat({ headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0, offsetYRatio: 0.13 }, 4),
  [BodyAnim.GkRunSide]: repeat({ headView: HeadView.Side, bodyScale: 0.68, headScale: 0.42, offsetXRatio: 0.18677396993231044, offsetYRatio: 0.05288377325392865 }, 8),
  // Light save — 3/4-front reflex block; front head seated like GkReady. Tune in /sandbox/sprite-editor.
  [BodyAnim.GkLightSave]: repeat({ headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 }, 4),
  [BodyAnim.GkDive]: [
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.11, offsetYRatio: 0.1 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: -0.06978095399641616, offsetYRatio: 0.2075580556828049 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.1190261588767345, offsetYRatio: 0.1 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.1553207024079418, offsetYRatio: 0.12151161113655959 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.22360731631117076, offsetYRatio: 0.13226741670484216 },
    { headView: HeadView.Front, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.31, offsetYRatio: 0.25 },
    { headView: HeadView.Front, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.37489901047884805, offsetYRatio: 0.3 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.2416619439589105, offsetYRatio: 0.26133708352420804 },
  ],
  // v6 dive (candidate_01): crouch anticipation (front), smeared side launch, prone slide, kneel recovery.
  // headScale compensates each frame's height ratio so the composited head stays a constant pixel size.
  [BodyAnim.GkDiveV2]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.12 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.48, offsetXRatio: 0.1, offsetYRatio: 0.14 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.84, offsetXRatio: 0.3, offsetYRatio: 0.55 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 1.24, offsetXRatio: 0.38, offsetYRatio: 0.75 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.55, offsetXRatio: 0.34, offsetYRatio: 0.35 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.72, offsetXRatio: 0.3, offsetYRatio: 0.5 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.63, offsetXRatio: 0.15, offsetYRatio: 0.4 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.63, offsetXRatio: 0.02, offsetYRatio: 0.25 },
  ],
};

/** Static open-arms pose: front head over frame 2 of the back-view arms-up body (playground call). */
export const ARMSUP_POSE_CFG: FrameCfg = { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.27 };

/** Head placement for the v4 headless outfield anims (knee celebrations are now headless too — see below). */
export const OUTFIELD_FRAME_CONFIG: Partial<Record<BodyAnim, FrameCfg[]>> = {
  [BodyAnim.TurnSide]: repeat({ headView: HeadView.Side, bodyScale: 1, headScale: 0.43, offsetXRatio: 0.11, offsetYRatio: 0.07 }, 4),
  [BodyAnim.StopBrake]: repeat({ headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 }, 4),
  [BodyAnim.ArmsUpRun]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.26660401942576045 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.02584160085864245, offsetYRatio: 0.2606383852350971 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.271802611218153 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.013106413175354574, offsetYRatio: 0.2505533932520053 },
  ],
  [BodyAnim.CelebrateJump]: repeat({ headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.27 }, 6),
  // Header pack: front head, mouth open on the wind-up/land frames and closed on the contact (frame 3).
  [BodyAnim.HeaderFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.FrontClosed, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
  ],
  // Receive/first-touch pack: front head throughout, contact on frame 2.
  [BodyAnim.ReceiveFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.006, offsetYRatio: 0.135 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: -0.004, offsetYRatio: 0.145 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
  ],
  // Intercept/steal pack: front head, cut on frame 3.
  [BodyAnim.InterceptFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.01, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.02, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.01, offsetYRatio: 0.14 },
  ],
  // Power-shot pack: front head, heavy contact on frame 3, follow-through on 4.
  [BodyAnim.PowerShotFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: -0.004, offsetYRatio: 0.135 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.006, offsetYRatio: 0.145 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.004, offsetYRatio: 0.145 },
  ],
  // Power-shot (back view): back head, higher seat on the shoulders.
  [BodyAnim.PowerShotBack]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.22 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: 0.004, offsetYRatio: 0.215 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.002, offsetYRatio: 0.218 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.22 },
  ],
  // Power-shot (side/profile view): side head, mirrors with facing; contact around frame 4.
  [BodyAnim.PowerShotSide]: [
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.18, offsetYRatio: 0.055 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.18, offsetYRatio: 0.055 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.17, offsetYRatio: 0.06 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.12, offsetYRatio: 0.07 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.09, offsetYRatio: 0.075 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.16, offsetYRatio: 0.06 },
  ],
  // Slide tackle (carrinho, regen v1) — side head, mirrors with facing. sizeScale keeps the tightly-cropped
  // horizontal pose from inflating under normalizedSizes.
  [BodyAnim.SlideTackle]: repeat({ headView: HeadView.Side, bodyScale: 1, headScale: 0.56, offsetXRatio: 0.1, offsetYRatio: 0.1, sizeScale: 0.62 }, 6),
  // Knee-celebration pack (now body-only regen) — front head throughout; per-frame offsets from the
  // preview's KNEE_CONFIG so the head seats through the slide → rise → jump. Replaces the old baked faces.
  // Knee celebration removed from the goal routine (arms-up only); configs kept for the sprite editor.
  [BodyAnim.KneeSlide]: repeat({ headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.14 }, 6),
  [BodyAnim.KneeRise]: repeat({ headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.14 }, 3),
  [BodyAnim.KneeJump]: repeat({ headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.135 }, 4),
};

/**
 * Head placement for the headless locomotion bodies used by persona casting (`features.personaHeads`).
 * Per-frame (arrays) so the composited head tracks the body's neck through the walk/run bob — tuned in
 * /sandbox/sprite-editor. `RunSide` mirrors with facing (headFlip). Idle anims only ever read frame 0.
 */
export const LOCOMOTION_FRAME_CONFIG: Partial<Record<BodyAnim, FrameCfg[]>> = {
  [BodyAnim.IdleFront]: [{ headView: HeadView.Front, bodyScale: 1, headScale: 0.5, offsetXRatio: 0, offsetYRatio: 0.12 }],
  [BodyAnim.WalkFront]: [{ headView: HeadView.Front, bodyScale: 1, headScale: 0.5, offsetXRatio: 0, offsetYRatio: 0.12 }],
  [BodyAnim.RunFront]: [{ headView: HeadView.Front, bodyScale: 1, headScale: 0.5, offsetXRatio: 0, offsetYRatio: 0.12 }],
  [BodyAnim.IdleBack]: [{ headView: HeadView.Back, bodyScale: 1, headScale: 0.5, offsetXRatio: 0, offsetYRatio: 0.1 }],
  [BodyAnim.WalkBack]: [{ headView: HeadView.Back, bodyScale: 1, headScale: 0.5, offsetXRatio: 0, offsetYRatio: 0.1 }],
  [BodyAnim.RunBack]: [{ headView: HeadView.Back, bodyScale: 1, headScale: 0.5, offsetXRatio: 0, offsetYRatio: 0.1 }],
  [BodyAnim.RunSide]: [{ headView: HeadView.Side, bodyScale: 1, headScale: 0.5, offsetXRatio: 0.1, offsetYRatio: 0.1 }],
  [BodyAnim.ShotFront]: [{ headView: HeadView.Front, bodyScale: 1, headScale: 0.5, offsetXRatio: 0, offsetYRatio: 0.12 }],
  [BodyAnim.ShotBack]: [{ headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.08 }],
};

/** The composited-head config for a persona locomotion body/frame (null = not a persona locomotion anim). */
export function locomotionConfigFor(mode: BodyAnim, frameIdx = 0): FrameCfg | null {
  const list = LOCOMOTION_FRAME_CONFIG[mode];
  if (!list || !list.length) return null;
  return list[Math.max(0, Math.min(frameIdx, list.length - 1))];
}

/** Resolves the composited-head config for an outfield mode/frame (null = whole sprite, head baked in). */
export function outfieldConfigFor(mode: BodyAnim, frameIdx: number, celebrationPhase: CelebrationPhase): FrameCfg | null {
  if (mode === BodyAnim.ArmsUpRun && (celebrationPhase === CelebrationPhase.Pose || celebrationPhase === CelebrationPhase.Loop)) {
    return ARMSUP_POSE_CFG;
  }
  const list = OUTFIELD_FRAME_CONFIG[mode];
  if (!list || !list.length) return null;
  return list[Math.min(frameIdx, list.length - 1)];
}
