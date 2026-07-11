import type { FrameCfg } from '@/game/realgk/assets/configs';
import { ITEM_MAP } from '@/game/realgk/assets/items';
import { personaBodyFrames } from '@/game/realgk/assets/manifest';
import { SIDE_MODES } from '@/game/realgk/composite';
import { REAL_GK_FRANCE_COMPLETE_CONFIG } from '@/game/realgk/config';
import { BodyAnim } from '@/game/realgk/enums';
import {
  applyLiveToAll,
  cfgIndexFor,
  LIVE_MAPS,
  liveList,
  patchLive,
  type ConfigMapKey,
  type EditorAnim,
  type NumericCfgKey,
} from './personas-match-editor-data';

export const FRANCE_STORAGE_KEY = 'realgk-france-match-editor-v1';

/** The France arena composites heads at this multiplier — the preview must too to stay 1:1. */
export const FRANCE_HEAD_SCALE = REAL_GK_FRANCE_COMPLETE_CONFIG.personaHeadScale ?? 1;

const FRANCE_ROOT = REAL_GK_FRANCE_COMPLETE_CONFIG.personaBodyRoot ?? '/game/franca';
const FRANCE_VERSION = REAL_GK_FRANCE_COMPLETE_CONFIG.assetVersion;

/**
 * Everything the France complete match plays. All bodies (keeper included) come from the franca family
 * root — in this config every actor is on the persona-body path, drawn whole (pre-trimmed frames).
 */
const ANIM_SET: [BodyAnim, string, ConfigMapKey][] = [
  [BodyAnim.GkDiveCompact, 'GK dive (compact)', 'keeper'],
  [BodyAnim.GkDiveV2, 'GK dive v2', 'keeper'],
  [BodyAnim.GkDive, 'GK dive save', 'keeper'],
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
  [BodyAnim.TurnSide, 'Turn (side)', 'outfield'],
  [BodyAnim.StopBrake, 'Stop / brake', 'outfield'],
  [BodyAnim.ArmsUpRun, 'Celebrate arms-up run', 'outfield'],
  [BodyAnim.CelebrateJump, 'Celebrate jump', 'outfield'],
  [BodyAnim.KneeSlide, 'Celebrate knee slide', 'outfield'],
  [BodyAnim.KneeRise, 'Celebrate knee rise', 'outfield'],
  [BodyAnim.KneeJump, 'Celebrate knee jump', 'outfield'],
  [BodyAnim.HeaderFront, 'Header', 'outfield'],
  [BodyAnim.ReceiveFront, 'Receive (first touch)', 'outfield'],
  [BodyAnim.InterceptFront, 'Intercept', 'outfield'],
  [BodyAnim.PowerShotFront, 'Power shot (front)', 'outfield'],
  [BodyAnim.PowerShotBack, 'Power shot (back)', 'outfield'],
  [BodyAnim.PowerShotSide, 'Power shot (side)', 'outfield'],
];

/** Dives that size by aspect (constant DIVE_LENGTH). Dive v2 sizes by DIVE2_HEIGHT_RATIO instead. */
const DIVE_ANIMS = new Set<BodyAnim>([BodyAnim.GkDive, BodyAnim.GkDiveCompact]);

export const FRANCE_ANIMS: EditorAnim[] = ANIM_SET.map(([id, label, map]) => {
  const item = ITEM_MAP[id];
  return {
    id,
    label: `${map === 'keeper' ? '🧤 ' : ''}${label}`,
    map,
    sideMode: SIDE_MODES.has(id),
    dive: DIVE_ANIMS.has(id),
    fps: item.fps,
    loop: item.loop,
    framePaths: personaBodyFrames(id, FRANCE_ROOT, item.frameCount, FRANCE_VERSION),
  };
});

// ---- body-size lock ----------------------------------------------------------------------------
// Under normalizedSizes the drawn height is base / max(0.75, 1 + headScale·HS − offsetY) · sizeScale,
// read from FRAME 0 of the anim — so shrinking the head silently GROWS the body. The lock keeps the
// height factor constant by counter-adjusting frame 0's sizeScale on every head edit.

const denom = (c: FrameCfg): number => Math.max(0.75, 1 + c.headScale * FRANCE_HEAD_SCALE - c.offsetYRatio);
const heightFactor = (c: FrameCfg): number => (c.sizeScale ?? 1) / denom(c);

const restoreFactor = (list: FrameCfg[], factor: number): void => {
  if (list[0]) list[0] = { ...list[0], sizeScale: Number((factor * denom(list[0])).toFixed(4)) };
};

/** patchLive + body-size lock (only frame-0 head edits can move the body height). */
export function patchLiveLocked(anim: EditorAnim, frame: number, part: Partial<FrameCfg>, lock: boolean): void {
  const list = liveList(anim);
  const affectsSize =
    lock &&
    !!list[0] &&
    cfgIndexFor(anim, frame) === 0 &&
    (part.headScale !== undefined || part.offsetYRatio !== undefined) &&
    part.sizeScale === undefined;
  const factor = affectsSize ? heightFactor(list[0]) : null;
  patchLive(anim, frame, part);
  if (factor !== null) restoreFactor(list, factor);
}

/** applyLiveToAll + body-size lock (copying a frame's cfg over frame 0 must not resize the body). */
export function applyLiveToAllLocked(anim: EditorAnim, frame: number, lock: boolean): void {
  const list = liveList(anim);
  const factor = lock && list[0] ? heightFactor(list[0]) : null;
  applyLiveToAll(anim, frame);
  if (factor !== null) restoreFactor(list, factor);
}

/** Anims sharing one character with `anim`: the keeper set, or the outfield boneco. */
export function sameFranceCharacterAnims(anim: EditorAnim): EditorAnim[] {
  return FRANCE_ANIMS.filter((a) => (a.map === 'keeper') === (anim.map === 'keeper'));
}

/** Pushes one field onto every frame of every anim of the character, keeping each anim's body height. */
export function applyFieldToFranceCharacter(anim: EditorAnim, key: NumericCfgKey, value: number, lock: boolean): void {
  for (const a of sameFranceCharacterAnims(anim)) {
    const list = liveList(a);
    const factor = lock && (key === 'headScale' || key === 'offsetYRatio') && list[0] ? heightFactor(list[0]) : null;
    for (let i = 0; i < list.length; i++) list[i] = { ...list[i], [key]: value };
    if (factor !== null) restoreFactor(list, factor);
  }
}

// ---- undo/redo -----------------------------------------------------------------------------------

type Saved = Record<ConfigMapKey, Record<string, FrameCfg[]>>;

/** Deep snapshot of every live map — one undo/redo unit. */
export function snapshotLive(): string {
  return JSON.stringify(LIVE_MAPS);
}

/** Restores a snapshot INTO the same live map objects the renderer/preview read. */
export function restoreLive(snapshot: string): void {
  const saved = JSON.parse(snapshot) as Saved;
  for (const key of Object.keys(LIVE_MAPS) as ConfigMapKey[]) {
    const live = LIVE_MAPS[key];
    for (const animId of Object.keys(live)) delete live[animId as BodyAnim];
    for (const [animId, list] of Object.entries(saved[key] ?? {})) {
      live[animId as BodyAnim] = (list as FrameCfg[]).map((c) => ({ ...c }));
    }
  }
}

// ---- persistence (own key so France sessions don't collide with the personas editor) ------------

export function saveFranceOverrides(): void {
  const out = {} as Saved;
  for (const key of Object.keys(LIVE_MAPS) as ConfigMapKey[]) {
    out[key] = {};
    for (const [animId, list] of Object.entries(LIVE_MAPS[key])) out[key][animId] = list as FrameCfg[];
  }
  localStorage.setItem(FRANCE_STORAGE_KEY, JSON.stringify(out));
}

export function loadFranceOverrides(): boolean {
  try {
    const raw = localStorage.getItem(FRANCE_STORAGE_KEY);
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

export function clearFranceOverrides(): void {
  localStorage.removeItem(FRANCE_STORAGE_KEY);
}
