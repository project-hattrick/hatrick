import { BodyAnim, CelebrationPhase, HeadView } from '../enums';

/** Per-frame head placement (body/head scale + offset ratios), ported verbatim. */
export interface FrameCfg {
  headView: HeadView;
  bodyScale: number;
  headScale: number;
  offsetXRatio: number;
  offsetYRatio: number;
}

const repeat = (cfg: FrameCfg, n: number): FrameCfg[] => Array.from({ length: n }, () => cfg);

export const KEEPER_FRAME_CONFIG: Partial<Record<BodyAnim, FrameCfg[]>> = {
  [BodyAnim.GkIdle]: repeat({ headView: HeadView.Side, bodyScale: 0.68, headScale: 0.48, offsetXRatio: -0.03625449786658669, offsetYRatio: 0.07711622674607024 }, 4),
  [BodyAnim.GkReady]: repeat({ headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0, offsetYRatio: 0.14 }, 4),
  [BodyAnim.GkShuffle]: repeat({ headView: HeadView.Front, bodyScale: 0.68, headScale: 0.47, offsetXRatio: 0.0, offsetYRatio: 0.13 }, 4),
  [BodyAnim.GkRunSide]: repeat({ headView: HeadView.Side, bodyScale: 0.68, headScale: 0.42, offsetXRatio: 0.18677396993231044, offsetYRatio: 0.05288377325392865 }, 8),
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
};

/** Static open-arms pose: front head over frame 2 of the back-view arms-up body (playground call). */
export const ARMSUP_POSE_CFG: FrameCfg = { headView: HeadView.Front, bodyScale: 1, headScale: 0.48, offsetXRatio: 0, offsetYRatio: 0.27 };

/** Head placement for the v4 headless outfield anims (knee frames ship with baked heads — no entry). */
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
};

/** Resolves the composited-head config for an outfield mode/frame (null = whole sprite, head baked in). */
export function outfieldConfigFor(mode: BodyAnim, frameIdx: number, celebrationPhase: CelebrationPhase): FrameCfg | null {
  if (mode === BodyAnim.ArmsUpRun && (celebrationPhase === CelebrationPhase.Pose || celebrationPhase === CelebrationPhase.Loop)) {
    return ARMSUP_POSE_CFG;
  }
  const list = OUTFIELD_FRAME_CONFIG[mode];
  if (!list || !list.length) return null;
  return list[Math.min(frameIdx, list.length - 1)];
}
