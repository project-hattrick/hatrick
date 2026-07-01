import { CheckpointId, RuntimeKind, type CheckpointMeta } from '../types';

/** Checkpoint 3: the Real Match Sim GK runtime (its own engine under src/game/realgk). */
export const REAL_GK_V2_META: CheckpointMeta = {
  id: CheckpointId.RealGkV2,
  title: 'Checkpoint 3 — Real Match GK',
  subtitle: 'Body+head dolls, a diving keeper & a roaming referee',
  version: 'v2.0',
  createdAt: '2026-06-30',
  accent: 'realgk',
  runtime: RuntimeKind.RealGk,
};
