import { ARENA_V1 } from './arena-v1';
import { CHUVA_V1 } from './chuva-v1';
import { REAL_GK_V2_META } from './real-gk-v2';
import { REAL_GK_V3_META } from './real-gk-v3';
import { REAL_GK_V4_META } from './real-gk-v4';
import { REAL_GK_V5_META } from './real-gk-v5';
import { REAL_GK_PLAY_META } from './real-gk-play';
import { REAL_GK_MATCH_META } from './real-gk-match';
import { CheckpointId, RuntimeKind, type CheckpointDef, type CheckpointMeta } from './types';

export { CheckpointId, RuntimeKind };
export type { CheckpointDef, CheckpointMeta };

/** Shared-engine data — only for Shared-runtime checkpoints. */
const SHARED_DEFS: Partial<Record<CheckpointId, CheckpointDef>> = {
  [CheckpointId.ChuvaV1]: CHUVA_V1,
  [CheckpointId.ArenaV1]: ARENA_V1,
};

/** All checkpoint metadata — every version stays selectable (history). */
export const CHECKPOINTS: CheckpointMeta[] = [CHUVA_V1.meta, ARENA_V1.meta, REAL_GK_V2_META, REAL_GK_V3_META, REAL_GK_V4_META, REAL_GK_V5_META, REAL_GK_PLAY_META, REAL_GK_MATCH_META];

const META = Object.fromEntries(CHECKPOINTS.map((m) => [m.id, m])) as Record<CheckpointId, CheckpointMeta>;

export const DEFAULT_CHECKPOINT = CheckpointId.ChuvaV1;

/** The checkpoint that plays live behind the home hero. */
export const HERO_CHECKPOINT = CheckpointId.RealGkV2;

export const isCheckpointId = (v: string): v is CheckpointId => v in META;

export const getCheckpointMeta = (id: CheckpointId): CheckpointMeta => META[id] ?? META[DEFAULT_CHECKPOINT];

export const getSharedCheckpoint = (id: CheckpointId): CheckpointDef =>
  SHARED_DEFS[id] ?? (SHARED_DEFS[DEFAULT_CHECKPOINT] as CheckpointDef);
