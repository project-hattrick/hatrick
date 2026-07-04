import { KEEPER_FRAME_CONFIG, OUTFIELD_FRAME_CONFIG, type FrameCfg } from '@/game/realgk/assets/configs';
import { ITEM_MAP } from '@/game/realgk/assets/items';
import { bodyFramePath, HEAD_PATHS } from '@/game/realgk/assets/manifest';
import { BodyAnim, HeadView } from '@/game/realgk/enums';

export const STORAGE_KEY = 'realgk-sprite-editor-v1';

/** Editable per-frame config (FrameCfg with sizeScale always present). */
export interface EditCfg {
  headView: HeadView;
  bodyScale: number;
  headScale: number;
  offsetXRatio: number;
  offsetYRatio: number;
  sizeScale: number;
  headFlip: boolean;
}

export const HEAD_VIEWS: HeadView[] = [HeadView.Front, HeadView.FrontClosed, HeadView.Side, HeadView.Back];

export const HEAD_SRC: Record<HeadView, string> = {
  [HeadView.Front]: HEAD_PATHS.front,
  [HeadView.FrontClosed]: HEAD_PATHS.frontClosed,
  [HeadView.Side]: HEAD_PATHS.side,
  [HeadView.Back]: HEAD_PATHS.back,
  [HeadView.FrontNeutral]: HEAD_PATHS.front,
  [HeadView.FrontFocus]: HEAD_PATHS.front,
};

const DEFAULT_CFG: FrameCfg = { headView: HeadView.Front, bodyScale: 1, headScale: 0.47, offsetXRatio: 0, offsetYRatio: 0.14 };

export interface EditorAnim {
  id: BodyAnim;
  label: string;
  group: 'Goalkeeper' | 'Outfield';
  framePaths: string[];
  /** Per-frame trim box (GK sheets) or null (v4 packs draw the whole frame). */
  bboxes: (number[] | null)[];
  seed: FrameCfg[];
}

const GK: [BodyAnim, string][] = [
  [BodyAnim.GkIdle, 'GK Idle'],
  [BodyAnim.GkReady, 'GK Ready'],
  [BodyAnim.GkShuffle, 'GK Shuffle'],
  [BodyAnim.GkRunSide, 'GK Run'],
  [BodyAnim.GkDive, 'GK Dive'],
  [BodyAnim.GkDiveV2, 'GK Dive v2'],
];

const OUT: [BodyAnim, string][] = [
  [BodyAnim.HeaderFront, 'Header'],
  [BodyAnim.ReceiveFront, 'Receive'],
  [BodyAnim.InterceptFront, 'Intercept'],
  [BodyAnim.PowerShotFront, 'Power shot (front)'],
  [BodyAnim.PowerShotSide, 'Power shot (side)'],
  [BodyAnim.PowerShotBack, 'Power shot (back)'],
  [BodyAnim.TurnSide, 'Turn'],
  [BodyAnim.StopBrake, 'Brake'],
  [BodyAnim.ArmsUpRun, 'Arms up'],
  [BodyAnim.CelebrateJump, 'Celebrate'],
];

function build(id: BodyAnim, label: string, group: EditorAnim['group'], seedMap: Partial<Record<BodyAnim, FrameCfg[]>>): EditorAnim {
  const item = ITEM_MAP[id];
  const seedList = seedMap[id] ?? [];
  return {
    id,
    label,
    group,
    framePaths: item.frames.map(bodyFramePath),
    bboxes: item.frames.map((_, i) => item.bboxes[i] ?? null),
    seed: item.frames.map((_, i) => seedList[Math.min(i, seedList.length - 1)] ?? DEFAULT_CFG),
  };
}

export const EDITOR_ANIMS: EditorAnim[] = [
  ...GK.map(([id, label]) => build(id, label, 'Goalkeeper', KEEPER_FRAME_CONFIG)),
  ...OUT.map(([id, label]) => build(id, label, 'Outfield', OUTFIELD_FRAME_CONFIG)),
];

const toEdit = (c: FrameCfg): EditCfg => ({
  headView: c.headView,
  bodyScale: c.bodyScale,
  headScale: c.headScale,
  offsetXRatio: c.offsetXRatio,
  offsetYRatio: c.offsetYRatio,
  sizeScale: c.sizeScale ?? 1,
  headFlip: c.headFlip ?? false,
});

/** Fresh editable state seeded from the engine's current configs. */
export function freshConfigs(): Record<string, EditCfg[]> {
  const out: Record<string, EditCfg[]> = {};
  for (const a of EDITOR_ANIMS) out[a.id] = a.seed.map(toEdit);
  return out;
}

/** The engine's current value for one frame — used to reset a single frame without losing the rest. */
export function seedCfg(animId: string, frame: number): EditCfg {
  const anim = EDITOR_ANIMS.find((a) => a.id === animId);
  return toEdit(anim?.seed[frame] ?? DEFAULT_CFG);
}

const f = (v: number) => Number(v.toFixed(4));

/** Serializes one frame back to FrameCfg source (sizeScale omitted when 1). */
function cfgSource(c: EditCfg): string {
  const parts = [
    `headView: HeadView.${headKey(c.headView)}`,
    `bodyScale: ${f(c.bodyScale)}`,
    `headScale: ${f(c.headScale)}`,
    `offsetXRatio: ${f(c.offsetXRatio)}`,
    `offsetYRatio: ${f(c.offsetYRatio)}`,
  ];
  if (Math.abs(c.sizeScale - 1) > 1e-4) parts.push(`sizeScale: ${f(c.sizeScale)}`);
  if (c.headFlip) parts.push(`headFlip: true`);
  return `{ ${parts.join(', ')} }`;
}

/** HeadView enum uses string values, so map value → key name for codegen. */
function headKey(v: HeadView): string {
  const entry = Object.entries(HeadView).find(([, val]) => val === v);
  return entry ? entry[0] : 'Front';
}

/** Generates paste-ready KEEPER_FRAME_CONFIG + OUTFIELD_FRAME_CONFIG source from the edited state. */
export function exportSource(configs: Record<string, EditCfg[]>): string {
  const block = (anims: EditorAnim[], name: string) => {
    const lines = anims.map((a) => {
      const frames = (configs[a.id] ?? []).map(cfgSource).join(',\n    ');
      return `  [BodyAnim.${animKey(a.id)}]: [\n    ${frames},\n  ],`;
    });
    return `export const ${name}: Partial<Record<BodyAnim, FrameCfg[]>> = {\n${lines.join('\n')}\n};`;
  };
  const gk = EDITOR_ANIMS.filter((a) => a.group === 'Goalkeeper');
  const out = EDITOR_ANIMS.filter((a) => a.group === 'Outfield');
  return `${block(gk, 'KEEPER_FRAME_CONFIG')}\n\n${block(out, 'OUTFIELD_FRAME_CONFIG')}`;
}

function animKey(id: BodyAnim): string {
  const entry = Object.entries(BodyAnim).find(([, val]) => val === id);
  return entry ? entry[0] : String(id);
}
