import type { AssetManifest } from '../assets/types';
import type { Formation } from '../core/types';
import type { CameraMode, RainLevel } from '../enums';
import type { Corners } from '../math/homography';

/** Stable identifier per checkpoint (engine version snapshot). */
export enum CheckpointId {
  ChuvaV1 = 'chuva-v1',
  ArenaV1 = 'arena-v1',
  RealGkV2 = 'real-gk-v2',
  RealGkV3 = 'real-gk-v3',
  RealGkV4 = 'real-gk-v4',
  RealGkV5 = 'real-gk-v5',
  RealGkV6 = 'real-gk-v6',
  RealGkPlay = 'real-gk-play',
  RealGkSolo = 'real-gk-solo',
  RealGkMatch = 'real-gk-match',
  RealGkPersonas = 'real-gk-personas',
  RealGkPersonaPlay = 'real-gk-persona-play',
  HeadsOnly = 'heads-only',
  EffectsLab = 'effects-lab',
}

/** Which engine a checkpoint runs on. The sandbox picks a Stage component per runtime. */
export enum RuntimeKind {
  Shared = 'shared',
  RealGk = 'real-gk',
  HeadsOnly = 'heads-only',
}

/** Display metadata surfaced on the home checkpoints list. */
export interface CheckpointMeta {
  id: CheckpointId;
  title: string;
  subtitle: string;
  version: string;
  createdAt: string;
  accent: string;
  runtime: RuntimeKind;
}

/** A checkpoint = the data bundle that parameterizes the shared engine. */
export interface CheckpointDef {
  meta: CheckpointMeta;
  field: { corners: Corners };
  formations: Formation[];
  manifest: AssetManifest;
  camera: CameraMode;
  rain: RainLevel;
  skipIntro?: boolean;
}
