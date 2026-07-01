import { BodyAnim, HeadView } from '../enums';

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
