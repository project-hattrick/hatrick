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

// Tuned in /sandbox/france-match-editor + /sandbox/france-lineup (export baked 11/07): every frame's
// head seat re-placed with the body-size lock on, so sizeScale values compensate the head edits and
// keep drawn heights unchanged. Dive v2 heads were re-seated for the dims-based height ratios.
export const KEEPER_FRAME_CONFIG: Partial<Record<BodyAnim, FrameCfg[]>> = {
  [BodyAnim.GkIdle]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0166, offsetYRatio: 0.1035, sizeScale: 1.0294 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0384, offsetYRatio: 0.1089 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0247, offsetYRatio: 0.1133 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0175, offsetYRatio: 0.0958 },
  ],
  [BodyAnim.GkReady]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.48, offsetXRatio: 0.0207, offsetYRatio: 0.082, sizeScale: 1.0994 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.455, offsetXRatio: 0.0457, offsetYRatio: 0.0967 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.475, offsetXRatio: 0.0351, offsetYRatio: 0.1023 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.445, offsetXRatio: 0.0331, offsetYRatio: 0.0859 },
  ],
  [BodyAnim.GkShuffle]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0232, offsetYRatio: 0.0894, sizeScale: 1.0325 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0608, offsetYRatio: 0.092 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: -0.0434, offsetYRatio: 0.0887 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0254, offsetYRatio: 0.0805 },
  ],
  [BodyAnim.GkRunSide]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.1193, offsetYRatio: 0.0987, sizeScale: 1.0256 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.2243, offsetYRatio: 0.1003 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.1341, offsetYRatio: 0.0983 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.1995, offsetYRatio: 0.1001 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.3065, offsetYRatio: 0.0983 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.2569, offsetYRatio: 0.1113 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.2744, offsetYRatio: 0.0871 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.2319, offsetYRatio: 0.0964 },
  ],
  [BodyAnim.GkLightSave]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.49, offsetXRatio: 0.0018, offsetYRatio: 0.1102, sizeScale: 1.0827 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.455, offsetXRatio: 0.0484, offsetYRatio: 0.1243 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.505, offsetXRatio: 0.0467, offsetYRatio: 0.1196, sizeScale: 0.99 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: -0.0027, offsetYRatio: 0.1015 },
  ],
  [BodyAnim.GkDiveCompact]: [
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.46, offsetXRatio: 0.0341, offsetYRatio: 0.1021, sizeScale: 1.0348 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.44, offsetXRatio: 0.0472, offsetYRatio: 0.1061 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.44, offsetXRatio: 0.1899, offsetYRatio: 0.1122 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.555, offsetXRatio: 0.2873, offsetYRatio: 0.1347 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.525, offsetXRatio: 0.5293, offsetYRatio: 0.6862 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.1422, offsetYRatio: 0.1119 },
  ],
  [BodyAnim.GkDive]: [
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.44, offsetXRatio: 0.0514, offsetYRatio: 0.1132, sizeScale: 0.8905 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.46, offsetXRatio: 0.0811, offsetYRatio: 0.1081 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.119, offsetYRatio: 0.1 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.505, offsetXRatio: 0.0929, offsetYRatio: 0.1492 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.2236, offsetYRatio: 0.1323 },
    { headView: HeadView.Front, bodyScale: 0.56, headScale: 0.525, offsetXRatio: 0.283, offsetYRatio: 0.3641 },
    { headView: HeadView.Front, bodyScale: 0.56, headScale: 0.61, offsetXRatio: 0.1236, offsetYRatio: 0.1491 },
    { headView: HeadView.Side, bodyScale: 0.56, headScale: 0.44, offsetXRatio: 0.0547, offsetYRatio: 0.1078 },
  ],
  [BodyAnim.GkDiveV2]: [
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.1474, offsetYRatio: 0.1324, sizeScale: 0.9902 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.42, offsetXRatio: 0.111, offsetYRatio: 0.1152 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.46, offsetXRatio: 0.1091, offsetYRatio: 0.1483 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.42, offsetXRatio: 0.1288, offsetYRatio: 0.3461 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.625, offsetXRatio: 0.4733, offsetYRatio: 0.1968 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.62, offsetXRatio: 0.5163, offsetYRatio: 0.3967 },
    { headView: HeadView.Side, bodyScale: 0.68, headScale: 0.63, offsetXRatio: 0.15, offsetYRatio: 0.4 },
    { headView: HeadView.Front, bodyScale: 0.68, headScale: 0.495, offsetXRatio: 0.1409, offsetYRatio: 0.1601 },
  ],
};

/** Static open-arms pose: front head over frame 2 of the back-view arms-up body (playground call). */
export const ARMSUP_POSE_CFG: FrameCfg = { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.27 };

/** Head placement for the v4 headless outfield anims (knee celebrations are now headless too). */
export const OUTFIELD_FRAME_CONFIG: Partial<Record<BodyAnim, FrameCfg[]>> = {
  [BodyAnim.TurnSide]: [
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.46, offsetXRatio: 0.1366, offsetYRatio: 0.0942, sizeScale: 1.0003 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.445, offsetXRatio: 0.0791, offsetYRatio: 0.098 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.43, offsetXRatio: 0.0247, offsetYRatio: 0.1005 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.43, offsetXRatio: 0.201, offsetYRatio: 0.1071 },
  ],
  [BodyAnim.StopBrake]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.42, offsetXRatio: -0.0072, offsetYRatio: 0.0885, sizeScale: 1.0075 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.425, offsetXRatio: 0.0849, offsetYRatio: 0.0875 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.425, offsetXRatio: 0.156, offsetYRatio: 0.0859 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.0458, offsetYRatio: 0.0941 },
  ],
  [BodyAnim.ArmsUpRun]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.395, offsetXRatio: -0.0126, offsetYRatio: 0.0839, sizeScale: 1.1001 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.395, offsetXRatio: 0.0015, offsetYRatio: 0.1879 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.41, offsetXRatio: 0.0068, offsetYRatio: 0.2275 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.375, offsetXRatio: -0.0062, offsetYRatio: 0.083 },
  ],
  [BodyAnim.CelebrateJump]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.0079, offsetYRatio: 0.0964, sizeScale: 1.1549 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.405, offsetXRatio: 0.0071, offsetYRatio: 0.1784 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.0167, offsetYRatio: 0.2286 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.425, offsetXRatio: -0.0016, offsetYRatio: 0.0888 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0.006, offsetYRatio: 0.0966 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.0077, offsetYRatio: 0.0903 },
  ],
  [BodyAnim.HeaderFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.425, offsetXRatio: 0.0006, offsetYRatio: 0.0981, sizeScale: 1.0039 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.39, offsetXRatio: -0.0225, offsetYRatio: 0.077 },
    { headView: HeadView.FrontClosed, bodyScale: 1, headScale: 0.44, offsetXRatio: -0.0165, offsetYRatio: 0.0761 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.0139, offsetYRatio: 0.0958 },
  ],
  [BodyAnim.ReceiveFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.4, offsetXRatio: -0.0041, offsetYRatio: 0.084, sizeScale: 0.9989 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.41, offsetXRatio: 0.0972, offsetYRatio: 0.0895 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.41, offsetXRatio: 0.135, offsetYRatio: 0.082 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.38, offsetXRatio: 0.0053, offsetYRatio: 0.0843 },
  ],
  [BodyAnim.InterceptFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.0058, offsetYRatio: 0.1199, sizeScale: 1.0161 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.425, offsetXRatio: 0.061, offsetYRatio: 0.0974 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0.0181, offsetYRatio: 0.1021 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.425, offsetXRatio: 0.0167, offsetYRatio: 0.0832 },
  ],
  [BodyAnim.PowerShotFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.39, offsetXRatio: -0.0072, offsetYRatio: 0.0812, sizeScale: 0.9945 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.41, offsetXRatio: -0.043, offsetYRatio: 0.0924 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.44, offsetXRatio: 0.0604, offsetYRatio: 0.0811 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.39, offsetXRatio: -0.0031, offsetYRatio: 0.0811 },
  ],
  [BodyAnim.PowerShotBack]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.365, offsetXRatio: 0.0226, offsetYRatio: 0.0579, sizeScale: 1.0574 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.38, offsetXRatio: -0.0124, offsetYRatio: 0.0634 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.375, offsetXRatio: -0.1212, offsetYRatio: 0.0686 },
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.38, offsetXRatio: -0.0085, offsetYRatio: 0.0672 },
  ],
  [BodyAnim.PowerShotSide]: [
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.45, offsetXRatio: 0.1434, offsetYRatio: 0.0882, sizeScale: 0.994 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.0712, offsetYRatio: 0.0923 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: -0.0386, offsetYRatio: 0.0922 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: -0.0834, offsetYRatio: 0.087 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.09, offsetYRatio: 0.075 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.42, offsetXRatio: 0.16, offsetYRatio: 0.06 },
  ],
  [BodyAnim.SlideTackle]: [
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.615, offsetXRatio: 0.088, offsetYRatio: 0.1046, sizeScale: 0.6816 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.555, offsetXRatio: -0.0721, offsetYRatio: 0.0968, sizeScale: 0.74 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.605, offsetXRatio: -0.0747, offsetYRatio: 0.1114, sizeScale: 0.74 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.625, offsetXRatio: -0.1077, offsetYRatio: 0.1386, sizeScale: 0.74 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.78, offsetXRatio: -0.15, offsetYRatio: 0.17, sizeScale: 0.74 },
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.78, offsetXRatio: -0.16, offsetYRatio: 0.17, sizeScale: 0.74 },
  ],
  [BodyAnim.KneeSlide]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.0161, offsetYRatio: 0.0981, sizeScale: 1.0338 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.0133, offsetYRatio: 0.0922 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.525, offsetXRatio: 0.0027, offsetYRatio: 0.107 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0.0955, offsetYRatio: 0.0961 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0.0476, offsetYRatio: 0.0889 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.0022, offsetYRatio: 0.1054 },
  ],
  [BodyAnim.KneeRise]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0.012, offsetYRatio: 0.1054, sizeScale: 1.0279 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: -0.016, offsetYRatio: 0.0916 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.39, offsetXRatio: -0.0036, offsetYRatio: 0.0726 },
  ],
  [BodyAnim.KneeJump]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.4, offsetXRatio: 0.0033, offsetYRatio: 0.0928, sizeScale: 0.9814 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.37, offsetXRatio: -0.0149, offsetYRatio: 0.1695 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.405, offsetXRatio: 0, offsetYRatio: 0.2246 },
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.44, offsetXRatio: 0.0083, offsetYRatio: 0.0833 },
  ],
};

/**
 * Head placement for the headless locomotion bodies used by persona casting (`features.personaHeads`).
 * One cfg per anim (frame 0 reads for every frame); `RunSide` mirrors with facing.
 */
export const LOCOMOTION_FRAME_CONFIG: Partial<Record<BodyAnim, FrameCfg[]>> = {
  [BodyAnim.IdleFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.46, offsetXRatio: 0.0042, offsetYRatio: 0.0736, sizeScale: 1.0108 },
  ],
  [BodyAnim.WalkFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.425, offsetXRatio: 0.0113, offsetYRatio: 0.0777, sizeScale: 0.9857 },
  ],
  [BodyAnim.RunFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.395, offsetXRatio: -0.0075, offsetYRatio: 0.0685, sizeScale: 0.9728 },
  ],
  [BodyAnim.IdleBack]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.38, offsetXRatio: 0.014, offsetYRatio: 0.0425, sizeScale: 0.9684 },
  ],
  [BodyAnim.WalkBack]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.405, offsetXRatio: 0.0116, offsetYRatio: 0.0524, sizeScale: 0.9769 },
  ],
  [BodyAnim.RunBack]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.39, offsetXRatio: 0.0325, offsetYRatio: 0.0449, sizeScale: 0.9731 },
  ],
  [BodyAnim.RunSide]: [
    { headView: HeadView.Side, bodyScale: 1, headScale: 0.455, offsetXRatio: 0.0927, offsetYRatio: 0.0843, sizeScale: 0.9835 },
  ],
  [BodyAnim.ShotFront]: [
    { headView: HeadView.Front, bodyScale: 1, headScale: 0.445, offsetXRatio: -0.0121, offsetYRatio: 0.0701, sizeScale: 1.0038 },
  ],
  [BodyAnim.ShotBack]: [
    { headView: HeadView.Back, bodyScale: 1, headScale: 0.4, offsetXRatio: 0.0626, offsetYRatio: 0.05, sizeScale: 0.9728 },
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
