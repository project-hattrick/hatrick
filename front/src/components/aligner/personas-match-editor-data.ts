import { KEEPER_FRAME_CONFIG, LOCOMOTION_FRAME_CONFIG, OUTFIELD_FRAME_CONFIG, type FrameCfg } from '@/game/realgk/assets/configs';
import { ITEM_MAP } from '@/game/realgk/assets/items';
import { personaHeadPaths, PERSONA_COUNT, REAL_GK_ROOT } from '@/game/realgk/assets/manifest';
import { SIDE_MODES } from '@/game/realgk/composite';
import { BodyAnim, HeadView } from '@/game/realgk/enums';

export const STORAGE_KEY = 'realgk-personas-match-editor-v1';

/**
 * This editor edits the LIVE config objects the match renderer reads every frame
 * (`keeperConfigFor` / `locomotionConfigFor` / `outfieldConfigFor` all resolve from these maps), so a
 * slider change shows up on the running pitch immediately — parity with the game is by construction,
 * not by re-implementation. Export writes the tuned values back as paste-ready `configs.ts` source.
 */
export type ConfigMapKey = 'keeper' | 'locomotion' | 'outfield';

export const LIVE_MAPS: Record<ConfigMapKey, Partial<Record<BodyAnim, FrameCfg[]>>> = {
  keeper: KEEPER_FRAME_CONFIG,
  locomotion: LOCOMOTION_FRAME_CONFIG,
  outfield: OUTFIELD_FRAME_CONFIG,
};

const MAP_SOURCE_NAME: Record<ConfigMapKey, string> = {
  keeper: 'KEEPER_FRAME_CONFIG',
  locomotion: 'LOCOMOTION_FRAME_CONFIG',
  outfield: 'OUTFIELD_FRAME_CONFIG',
};

/** Pristine copy taken before any live edit / saved override lands, so Reset always means "source". */
const BASELINE: Record<ConfigMapKey, Partial<Record<BodyAnim, FrameCfg[]>>> = structuredClone(LIVE_MAPS);

export interface EditorAnim {
  id: BodyAnim;
  label: string;
  map: ConfigMapKey;
  /** Profile anim: body (and side head) mirror with facing. */
  sideMode: boolean;
  /** Dive anims size by aspect (DIVE_LENGTH) in the match — the preview must too. */
  dive: boolean;
  fps: number;
  loop: boolean;
  framePaths: string[];
}

const PLAYERS_ROOT = '/game/personas/players';

/** Everything the personas match actually plays, keeper set first (the dive is the headline act). */
const ANIM_SET: [BodyAnim, string, ConfigMapKey][] = [
  [BodyAnim.GkDiveCompact, 'GK dive (compact)', 'keeper'],
  [BodyAnim.GkLightSave, 'GK light save', 'keeper'],
  [BodyAnim.GkIdle, 'GK idle', 'keeper'],
  [BodyAnim.GkReady, 'GK ready', 'keeper'],
  [BodyAnim.GkShuffle, 'GK shuffle', 'keeper'],
  [BodyAnim.GkRunSide, 'GK run (side)', 'keeper'],
  [BodyAnim.IdleFront, 'Idle (front)', 'locomotion'],
  [BodyAnim.WalkFront, 'Walk (front)', 'locomotion'],
  [BodyAnim.RunFront, 'Run (front)', 'locomotion'],
  [BodyAnim.IdleBack, 'Idle (back)', 'locomotion'],
  [BodyAnim.WalkBack, 'Walk (back)', 'locomotion'],
  [BodyAnim.RunBack, 'Run (back)', 'locomotion'],
  [BodyAnim.RunSide, 'Run (side)', 'locomotion'],
  [BodyAnim.ShotFront, 'Persona shot (front)', 'locomotion'],
  [BodyAnim.ShotBack, 'Persona shot (back)', 'locomotion'],
  [BodyAnim.SlideTackle, 'Slide tackle (carrinho)', 'outfield'],
];

const DIVE_ANIMS = new Set<BodyAnim>([BodyAnim.GkDive, BodyAnim.GkDiveCompact, BodyAnim.GkDiveV2]);

function build(id: BodyAnim, label: string, map: ConfigMapKey): EditorAnim {
  const item = ITEM_MAP[id];
  const root = map === 'locomotion' ? PLAYERS_ROOT : REAL_GK_ROOT;
  return {
    id,
    label,
    map,
    sideMode: SIDE_MODES.has(id),
    dive: DIVE_ANIMS.has(id),
    fps: item.fps,
    loop: item.loop,
    framePaths: item.frames.map((name) => `${root}/${name}`),
  };
}

export const EDITOR_ANIMS: EditorAnim[] = ANIM_SET.map(([id, label, map]) => build(id, label, map));

export const PERSONA_INDICES: number[] = Array.from({ length: PERSONA_COUNT }, (_, i) => i);

/** Head bust paths for one persona index, matching the match loader. */
export function headSrcFor(index: number): Record<'front' | 'back' | 'side', string> {
  const p = personaHeadPaths(((index % PERSONA_COUNT) + PERSONA_COUNT) % PERSONA_COUNT);
  return { front: p.front, back: p.back, side: p.side };
}

/** The live per-frame config list this anim renders with (same array the match reads). */
export function liveList(anim: EditorAnim): FrameCfg[] {
  return LIVE_MAPS[anim.map][anim.id] ?? [];
}

/** Config index a given frame resolves to (short lists clamp — e.g. loco anims keep ONE cfg for all frames). */
export function cfgIndexFor(anim: EditorAnim, frame: number): number {
  return Math.max(0, Math.min(frame, liveList(anim).length - 1));
}

/** Patches the LIVE config in place — the running match picks it up on its next rendered frame. */
export function patchLive(anim: EditorAnim, frame: number, part: Partial<FrameCfg>): void {
  const list = liveList(anim);
  const i = cfgIndexFor(anim, frame);
  if (list[i]) list[i] = { ...list[i], ...part };
}

/** Copies the current frame's cfg over every frame of the anim (live). */
export function applyLiveToAll(anim: EditorAnim, frame: number): void {
  const list = liveList(anim);
  const src = list[cfgIndexFor(anim, frame)];
  if (!src) return;
  for (let i = 0; i < list.length; i++) list[i] = { ...src };
}

/** Numeric FrameCfg fields that can be propagated across anims. */
export type NumericCfgKey = 'headScale' | 'offsetXRatio' | 'offsetYRatio' | 'sizeScale' | 'bodyScale';

/** Anims that share one character with `anim`: the keeper set, or the outfield boneco (loco + outfield). */
export function sameCharacterAnims(anim: EditorAnim): EditorAnim[] {
  return EDITOR_ANIMS.filter((a) => (a.map === 'keeper') === (anim.map === 'keeper'));
}

/** Applies ONE field's value to every frame of every anim of the same character (live). */
export function applyFieldToCharacter(anim: EditorAnim, key: NumericCfgKey, value: number): void {
  for (const a of sameCharacterAnims(anim)) {
    const list = liveList(a);
    for (let i = 0; i < list.length; i++) list[i] = { ...list[i], [key]: value };
  }
}

/** Restores one anim to its checked-in source values. */
export function resetLive(anim: EditorAnim): void {
  const src = BASELINE[anim.map][anim.id];
  if (src) LIVE_MAPS[anim.map][anim.id] = structuredClone(src);
}

/** Restores every map wholesale to source values. */
export function resetAllLive(): void {
  for (const key of Object.keys(LIVE_MAPS) as ConfigMapKey[]) {
    const live = LIVE_MAPS[key];
    for (const animId of Object.keys(live)) delete live[animId as BodyAnim];
    Object.assign(live, structuredClone(BASELINE[key]));
  }
}

// ---- persistence (editor-local; the game only changes for real via export → configs.ts) ----

type Saved = Record<ConfigMapKey, Record<string, FrameCfg[]>>;

export function saveOverrides(): void {
  const out = {} as Saved;
  for (const key of Object.keys(LIVE_MAPS) as ConfigMapKey[]) {
    out[key] = {};
    for (const [animId, list] of Object.entries(LIVE_MAPS[key])) out[key][animId] = list as FrameCfg[];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
}

/** Re-applies the last session's edits onto the live maps (no-op when nothing is saved). */
export function loadOverrides(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw) as Saved;
    for (const key of Object.keys(LIVE_MAPS) as ConfigMapKey[]) {
      for (const [animId, list] of Object.entries(saved[key] ?? {})) {
        if (Array.isArray(list) && list.length) LIVE_MAPS[key][animId as BodyAnim] = list.map((c) => ({ ...c }));
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function clearOverrides(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ---- export (paste-ready configs.ts source, from the LIVE values) ----

const f = (v: number) => Number(v.toFixed(4));

function headKey(v: HeadView): string {
  const entry = Object.entries(HeadView).find(([, val]) => val === v);
  return entry ? entry[0] : 'Front';
}

function animKey(id: string): string {
  const entry = Object.entries(BodyAnim).find(([, val]) => val === id);
  return entry ? entry[0] : id;
}

function cfgSource(c: FrameCfg): string {
  const parts = [
    `headView: HeadView.${headKey(c.headView)}`,
    `bodyScale: ${f(c.bodyScale)}`,
    `headScale: ${f(c.headScale)}`,
    `offsetXRatio: ${f(c.offsetXRatio)}`,
    `offsetYRatio: ${f(c.offsetYRatio)}`,
  ];
  if (c.sizeScale !== undefined && Math.abs(c.sizeScale - 1) > 1e-4) parts.push(`sizeScale: ${f(c.sizeScale)}`);
  if (c.headFlip) parts.push(`headFlip: true`);
  return `{ ${parts.join(', ')} }`;
}

/** Full source for the three maps — includes untouched entries so the paste replaces each map wholesale. */
export function exportSource(): string {
  const block = (key: ConfigMapKey): string => {
    const lines = Object.entries(LIVE_MAPS[key]).map(([animId, list]) => {
      const frames = (list as FrameCfg[]).map(cfgSource).join(',\n    ');
      return `  [BodyAnim.${animKey(animId)}]: [\n    ${frames},\n  ],`;
    });
    return `export const ${MAP_SOURCE_NAME[key]}: Partial<Record<BodyAnim, FrameCfg[]>> = {\n${lines.join('\n')}\n};`;
  };
  return `${block('keeper')}\n\n${block('outfield')}\n\n${block('locomotion')}`;
}
