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

// Tuned in /sandbox/france-match-editor (free board, 10/07): frame-1 head seats re-placed with the
// body-size lock on, so the sizeScale values compensate the head edits and keep drawn heights unchanged.
export const KEEPER_FRAME_CONFIG: Partial<Record<BodyAnim, FrameCfg[]>> = {
  [BodyAnim.GkIdle]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0166, offsetYRatio: 0.1035, sizeScale: 1.0294 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
  ],
  [BodyAnim.GkReady]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.48, offsetXRatio: 0.0207, offsetYRatio: 0.082, sizeScale: 1.0994 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.405, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.405, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.405, offsetXRatio: 0, offsetYRatio: 0.14 },
  ],
  [BodyAnim.GkShuffle]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0232, offsetYRatio: 0.0894, sizeScale: 1.0325 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.13 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.13 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.13 },
  ],
  [BodyAnim.GkRunSide]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.1261, offsetYRatio: 0.1103, sizeScale: 1.0164 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.13 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.13 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.13 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.13 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.13 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.13 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.13 },
  ],
  [BodyAnim.GkLightSave]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.49, offsetXRatio: 0.0018, offsetYRatio: 0.1102, sizeScale: 1.0827 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.405, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.405, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.405, offsetXRatio: 0, offsetYRatio: 0.14 },
  ],
  [BodyAnim.GkDiveCompact]: [
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.46, offsetXRatio: 0.0341, offsetYRatio: 0.1021, sizeScale: 1.0348 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.405, offsetXRatio: 0.0923, offsetYRatio: 0.1128 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.405, offsetXRatio: 0.0826, offsetYRatio: 0.1077 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.68, offsetXRatio: 0.2434, offsetYRatio: 0.158 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.67, offsetXRatio: 0.4028, offsetYRatio: 0.3848 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.77, offsetXRatio: 0.35, offsetYRatio: 0.48 },
  ],
  [BodyAnim.GkDive]: [
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.44, offsetXRatio: 0.0514, offsetYRatio: 0.1132, sizeScale: 0.8905 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: -0.0698, offsetYRatio: 0.2076 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.119, offsetYRatio: 0.1 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.1553, offsetYRatio: 0.1215 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.2236, offsetYRatio: 0.1323 },
    { headView: HeadView.Front, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.31, offsetYRatio: 0.25 },
    { headView: HeadView.Front, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.3749, offsetYRatio: 0.3 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.2417, offsetYRatio: 0.2613 },
  ],
  // v6 dive (candidate_01): crouch anticipation (front), smeared side launch, prone slide, kneel recovery.
  // headScale compensates each frame's height ratio so the composited head stays a constant pixel size.
  [BodyAnim.GkDiveV2]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.1474, offsetYRatio: 0.1324, sizeScale: 0.9902 },
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

/** Head placement for the v4 headless outfield anims (knee celebrations are now headless too). */
export const OUTFIELD_FRAME_CONFIG: Partial<Record<BodyAnim, FrameCfg[]>> = {
  [BodyAnim.TurnSide]: [
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.46, offsetXRatio: 0.1366, offsetYRatio: 0.0942, sizeScale: 1.0003 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.43, offsetXRatio: 0.11, offsetYRatio: 0.07 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.43, offsetXRatio: 0.11, offsetYRatio: 0.07 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.43, offsetXRatio: 0.11, offsetYRatio: 0.07 },
  ],
  [BodyAnim.StopBrake]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: -0.0047, offsetYRatio: 0.077, sizeScale: 1.0497 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
  ],
  [BodyAnim.ArmsUpRun]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.0126, offsetYRatio: 0.0839, sizeScale: 1.1619 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.0258, offsetYRatio: 0.2606 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.2718 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.0131, offsetYRatio: 0.2506 },
  ],
  [BodyAnim.CelebrateJump]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.0079, offsetYRatio: 0.0934, sizeScale: 1.1575 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.27 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.27 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.27 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.27 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.27 },
  ],
  // Header pack: front head, mouth open on the wind-up/land frames and closed on the contact (frame 3).
  [BodyAnim.HeaderFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.425, offsetXRatio: 0.0006, offsetYRatio: 0.0981, sizeScale: 1.0039 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.FrontClosed, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
  ],
  [BodyAnim.ReceiveFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.4, offsetXRatio: -0.0041, offsetYRatio: 0.084, sizeScale: 0.9989 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.006, offsetYRatio: 0.135 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: -0.004, offsetYRatio: 0.145 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 },
  ],
  [BodyAnim.InterceptFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.0058, offsetYRatio: 0.1199, sizeScale: 1.0161 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.01, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.02, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.01, offsetYRatio: 0.14 },
  ],
  [BodyAnim.PowerShotFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.39, offsetXRatio: -0.0072, offsetYRatio: 0.0812, sizeScale: 0.9945 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: -0.004, offsetYRatio: 0.135 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.006, offsetYRatio: 0.145 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.004, offsetYRatio: 0.145 },
  ],
  [BodyAnim.PowerShotBack]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.365, offsetXRatio: 0.0226, offsetYRatio: 0.0579, sizeScale: 1.0574 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: 0.004, offsetYRatio: 0.215 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.002, offsetYRatio: 0.218 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.22 },
  ],
  [BodyAnim.PowerShotSide]: [
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.45, offsetXRatio: 0.1469, offsetYRatio: 0.0917, sizeScale: 0.9913 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.18, offsetYRatio: 0.055 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.17, offsetYRatio: 0.06 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.12, offsetYRatio: 0.07 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.09, offsetYRatio: 0.075 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.16, offsetYRatio: 0.06 },
  ],
  // Slide tackle (carrinho): side head, mirrors with facing; sizeScale keeps the pose from inflating.
  [BodyAnim.SlideTackle]: [
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.615, offsetXRatio: 0.088, offsetYRatio: 0.1046, sizeScale: 0.6816 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.78, offsetXRatio: -0.09, offsetYRatio: 0.14, sizeScale: 0.74 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.78, offsetXRatio: -0.14, offsetYRatio: 0.16, sizeScale: 0.74 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.78, offsetXRatio: -0.15, offsetYRatio: 0.16, sizeScale: 0.74 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.78, offsetXRatio: -0.15, offsetYRatio: 0.17, sizeScale: 0.74 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.78, offsetXRatio: -0.16, offsetYRatio: 0.17, sizeScale: 0.74 },
  ],
  [BodyAnim.KneeSlide]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.0181, offsetYRatio: 0.0981, sizeScale: 1.0336 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.14 },
  ],
  [BodyAnim.KneeRise]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0.012, offsetYRatio: 0.1054, sizeScale: 1.0279 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.14 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.14 },
  ],
  [BodyAnim.KneeJump]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.4, offsetXRatio: 0.0033, offsetYRatio: 0.0928, sizeScale: 0.9814 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.135 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.135 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.135 },
  ],
};

/**
 * Head placement for the headless locomotion bodies used by persona casting (`features.personaHeads`).
 * One cfg per anim (frame 0 reads for every frame); `RunSide` mirrors with facing.
 */
export const LOCOMOTION_FRAME_CONFIG: Partial<Record<BodyAnim, FrameCfg[]>> = {
  [BodyAnim.IdleFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.005, offsetYRatio: 0.077, sizeScale: 0.9825 },
  ],
  [BodyAnim.WalkFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.425, offsetXRatio: 0.0027, offsetYRatio: 0.0749, sizeScale: 0.9875 },
  ],
  [BodyAnim.RunFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.395, offsetXRatio: -0.0075, offsetYRatio: 0.0685, sizeScale: 0.9728 },
  ],
  [BodyAnim.IdleBack]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.37, offsetXRatio: -0.0096, offsetYRatio: 0.0615, sizeScale: 0.9478 },
  ],
  [BodyAnim.WalkBack]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.445, offsetXRatio: 0.0142, offsetYRatio: 0.0543, sizeScale: 1.0005 },
  ],
  [BodyAnim.RunBack]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.39, offsetXRatio: 0.0123, offsetYRatio: 0.0587, sizeScale: 0.9625 },
  ],
  [BodyAnim.RunSide]: [
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.5, offsetXRatio: 0.1414, offsetYRatio: 0.0842, sizeScale: 1.0121 },
  ],
  [BodyAnim.ShotFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.445, offsetXRatio: -0.0084, offsetYRatio: 0.0888, sizeScale: 0.9895 },
  ],
  [BodyAnim.ShotBack]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.4, offsetXRatio: 0.0149, offsetYRatio: 0.0656, sizeScale: 0.9613 },
  ],
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
