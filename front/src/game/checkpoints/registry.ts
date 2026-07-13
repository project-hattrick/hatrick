import { REAL_GK_MATCH_META } from './real-gk-match';
import { CheckpointId, RuntimeKind, type CheckpointMeta } from './types';

export { CheckpointId, RuntimeKind };
export type { CheckpointMeta };

/** All shipped checkpoint metadata. */
export const CHECKPOINTS: CheckpointMeta[] = [REAL_GK_MATCH_META];

const META = Object.fromEntries(CHECKPOINTS.map((m) => [m.id, m])) as Record<CheckpointId, CheckpointMeta>;

/** The checkpoint that plays live behind the home hero. */
export const HERO_CHECKPOINT = CheckpointId.RealGkMatch;

export const isCheckpointId = (v: string): v is CheckpointId => v in META;

export const getCheckpointMeta = (id: CheckpointId): CheckpointMeta => META[id] ?? REAL_GK_MATCH_META;
