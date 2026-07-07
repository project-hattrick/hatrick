import { LOCOMOTION_FRAME_CONFIG, OUTFIELD_FRAME_CONFIG, type FrameCfg } from '@/game/realgk/assets/configs';
import { ITEM_MAP } from '@/game/realgk/assets/items';
import { personaHeadPaths, PERSONA_COUNT } from '@/game/realgk/assets/manifest';
import { SIDE_MODES } from '@/game/realgk/composite';
import { BodyAnim, HeadView } from '@/game/realgk/enums';

export const STORAGE_KEY = 'realgk-persona-editor-v1';

/** The court background the match paints (same one the persona game uses). */
export const COURT_BG = '/game/stadiums/rain-court/court.png';

/** Base drawn height (game units) the editor renders at. The compositing is scale-invariant, so relative
 *  head/body placement here is IDENTICAL to the match — only the absolute size (and zoom) differ. */
export const EDITOR_BASE = 240;

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

/** Where a persona anim's body frames + head config come from — matches how the match loader wires them. */
export interface PersonaAnim {
  id: BodyAnim;
  label: string;
  /** `loco` → headless bodies in personas/players + LOCOMOTION config; `outfield` → real-gk bodies + OUTFIELD config. */
  kind: 'loco' | 'outfield';
  /** Profile anim: the body (and side head) mirror with facing. */
  sideMode: boolean;
  fps: number;
  loop: boolean;
  /** Full body-frame image paths (from the same source the match loads). */
  framePaths: string[];
  seed: FrameCfg[];
}

const DEFAULT_CFG: FrameCfg = { headView: HeadView.Front, bodyScale: 1, headScale: 0.5, offsetXRatio: 0, offsetYRatio: 0.12 };

const PLAYERS_ROOT = '/game/personas/players';
const REALGK_ROOT = '/game/real-gk';

const LOCO: [BodyAnim, string][] = [
  [BodyAnim.IdleFront, 'Idle (front)'],
  [BodyAnim.WalkFront, 'Walk (front)'],
  [BodyAnim.RunFront, 'Run (front)'],
  [BodyAnim.IdleBack, 'Idle (back)'],
  [BodyAnim.WalkBack, 'Walk (back)'],
  [BodyAnim.RunBack, 'Run (back)'],
  [BodyAnim.RunSide, 'Run (side)'],
  [BodyAnim.ShotFront, 'Shot (front)'],
  [BodyAnim.ShotBack, 'Shot (back)'],
];

const OUTFIELD: [BodyAnim, string][] = [
  [BodyAnim.SlideTackle, 'Slide tackle (carrinho)'],
  [BodyAnim.KneeSlide, 'Knee slide'],
  [BodyAnim.KneeRise, 'Knee rise'],
  [BodyAnim.KneeJump, 'Knee jump'],
];

function seedFor(id: BodyAnim, kind: 'loco' | 'outfield'): FrameCfg[] {
  const list = kind === 'loco' ? LOCOMOTION_FRAME_CONFIG[id] : OUTFIELD_FRAME_CONFIG[id];
  return list && list.length ? list : [];
}

function build(id: BodyAnim, label: string, kind: 'loco' | 'outfield'): PersonaAnim {
  const item = ITEM_MAP[id];
  const root = kind === 'loco' ? PLAYERS_ROOT : REALGK_ROOT;
  const seedList = seedFor(id, kind);
  return {
    id,
    label,
    kind,
    sideMode: SIDE_MODES.has(id),
    fps: item.fps,
    loop: item.loop,
    framePaths: item.frames.map((name) => `${root}/${name}`),
    seed: item.frames.map((_, i) => seedList[Math.min(i, seedList.length - 1)] ?? DEFAULT_CFG),
  };
}

export const PERSONA_ANIMS: PersonaAnim[] = [
  ...LOCO.map(([id, label]) => build(id, label, 'loco')),
  ...OUTFIELD.map(([id, label]) => build(id, label, 'outfield')),
];

/** Head bust paths for one persona index (front / back / side_right), matching the match loader. */
export function headSrcFor(index: number): Record<'front' | 'back' | 'side', string> {
  const p = personaHeadPaths(((index % PERSONA_COUNT) + PERSONA_COUNT) % PERSONA_COUNT);
  return { front: p.front, back: p.back, side: p.side };
}

export const PERSONA_INDICES: number[] = Array.from({ length: PERSONA_COUNT }, (_, i) => i);

const toEdit = (c: FrameCfg): EditCfg => ({
  headView: c.headView,
  bodyScale: c.bodyScale,
  headScale: c.headScale,
  offsetXRatio: c.offsetXRatio,
  offsetYRatio: c.offsetYRatio,
  sizeScale: c.sizeScale ?? 1,
  headFlip: c.headFlip ?? false,
});

export function freshConfigs(): Record<string, EditCfg[]> {
  const out: Record<string, EditCfg[]> = {};
  for (const a of PERSONA_ANIMS) out[a.id] = a.seed.map(toEdit);
  return out;
}

export function seedCfg(animId: string, frame: number): EditCfg {
  const anim = PERSONA_ANIMS.find((a) => a.id === animId);
  return toEdit(anim?.seed[frame] ?? DEFAULT_CFG);
}

const f = (v: number) => Number(v.toFixed(4));

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

function headKey(v: HeadView): string {
  const entry = Object.entries(HeadView).find(([, val]) => val === v);
  return entry ? entry[0] : 'Front';
}

function animKey(id: BodyAnim): string {
  const entry = Object.entries(BodyAnim).find(([, val]) => val === id);
  return entry ? entry[0] : String(id);
}

/** Paste-ready source split by destination: loco anims → LOCOMOTION_FRAME_CONFIG, outfield → OUTFIELD_FRAME_CONFIG. */
export function exportSource(configs: Record<string, EditCfg[]>): string {
  const block = (kind: 'loco' | 'outfield', name: string) => {
    const lines = PERSONA_ANIMS.filter((a) => a.kind === kind).map((a) => {
      const frames = (configs[a.id] ?? []).map(cfgSource).join(',\n    ');
      return `  [BodyAnim.${animKey(a.id)}]: [\n    ${frames},\n  ],`;
    });
    return `export const ${name}: Partial<Record<BodyAnim, FrameCfg[]>> = {\n${lines.join('\n')}\n};`;
  };
  return `${block('loco', 'LOCOMOTION_FRAME_CONFIG')}\n\n${block('outfield', 'OUTFIELD_FRAME_CONFIG')}`;
}
