import { LOCOMOTION_FRAME_CONFIG, OUTFIELD_FRAME_CONFIG, type FrameCfg } from '@/game/realgk/assets/configs';
import { ITEM_MAP } from '@/game/realgk/assets/items';
import { personaHeadPaths } from '@/game/realgk/assets/manifest';
import { BodyAnim, HeadView } from '@/game/realgk/enums';

export const STORAGE_KEY = 'realgk-sprite-editor-v2';

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

export const HEAD_VIEWS: HeadView[] = [HeadView.Front, HeadView.Side, HeadView.Back];

/** The editor composites the current persona head (p01) so tuning matches what the sandbox bonecos show. */
const P0 = personaHeadPaths(0);
export const HEAD_SRC: Record<HeadView, string> = {
  [HeadView.Front]: P0.front,
  [HeadView.FrontClosed]: P0.front,
  [HeadView.Side]: P0.side,
  [HeadView.Back]: P0.back,
  [HeadView.FrontNeutral]: P0.front,
  [HeadView.FrontFocus]: P0.front,
};

const DEFAULT_CFG: FrameCfg = { headView: HeadView.Front, bodyScale: 1, headScale: 0.5, offsetXRatio: 0, offsetYRatio: 0.12 };

/** Headless regen bodies live here (the "sandbox mais recente" characters), NOT the baked real-gk/ sheets. */
const REGEN_ROOT = '/game/personas/body-regen-v1';
const regenPath = (name: string): string => `${REGEN_ROOT}/${name}`;

export interface EditorAnim {
  id: BodyAnim;
  label: string;
  group: 'Goalkeeper' | 'Outfield';
  framePaths: string[];
  /** Regen bodies are drawn whole (already trimmed) — no per-frame box. */
  bboxes: (number[] | null)[];
  seed: FrameCfg[];
}

/** Only the anims the current persona bonecos use — locomotion (front/back/side), both shots, slide, knees. */
const PERSONA: [BodyAnim, string][] = [
  [BodyAnim.IdleFront, 'Idle (front)'],
  [BodyAnim.WalkFront, 'Walk (front)'],
  [BodyAnim.RunFront, 'Run (front)'],
  [BodyAnim.IdleBack, 'Idle (back)'],
  [BodyAnim.WalkBack, 'Walk (back)'],
  [BodyAnim.RunBack, 'Run (back)'],
  [BodyAnim.RunSide, 'Run (side)'],
  [BodyAnim.ShotFront, 'Shot (front)'],
  [BodyAnim.ShotBack, 'Shot (back)'],
  [BodyAnim.SlideTackle, 'Slide tackle (carrinho)'],
  [BodyAnim.KneeSlide, 'Knee slide'],
  [BodyAnim.KneeRise, 'Knee rise'],
  [BodyAnim.KneeJump, 'Knee jump'],
];

/** Seed from whichever config owns the anim: OUTFIELD (array) or LOCOMOTION (single cfg → one-frame array). */
function seedFor(id: BodyAnim): FrameCfg[] {
  const outfield = OUTFIELD_FRAME_CONFIG[id];
  if (outfield && outfield.length) return outfield;
  return LOCOMOTION_FRAME_CONFIG[id] ?? [];
}

function build(id: BodyAnim, label: string): EditorAnim {
  const item = ITEM_MAP[id];
  const seedList = seedFor(id);
  return {
    id,
    label,
    group: 'Outfield',
    framePaths: item.frames.map(regenPath),
    bboxes: item.frames.map(() => null),
    seed: item.frames.map((_, i) => seedList[Math.min(i, seedList.length - 1)] ?? DEFAULT_CFG),
  };
}

export const EDITOR_ANIMS: EditorAnim[] = PERSONA.map(([id, label]) => build(id, label));

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

/**
 * Generates paste-ready source. Single-frame anims (locomotion + shots) print one FrameCfg for
 * LOCOMOTION_FRAME_CONFIG; multi-frame anims (slide, knees) print an array for OUTFIELD_FRAME_CONFIG.
 */
export function exportSource(configs: Record<string, EditCfg[]>): string {
  const lines = EDITOR_ANIMS.map((a) => {
    const frames = configs[a.id] ?? [];
    if (frames.length <= 1) return `  [BodyAnim.${animKey(a.id)}]: ${cfgSource(frames[0] ?? toEdit(DEFAULT_CFG))},`;
    return `  [BodyAnim.${animKey(a.id)}]: [\n    ${frames.map(cfgSource).join(',\n    ')},\n  ],`;
  });
  return `// Single-frame entries → LOCOMOTION_FRAME_CONFIG; array entries → OUTFIELD_FRAME_CONFIG.\n{\n${lines.join('\n')}\n}`;
}

function animKey(id: BodyAnim): string {
  const entry = Object.entries(BodyAnim).find(([, val]) => val === id);
  return entry ? entry[0] : String(id);
}
