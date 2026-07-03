import { CheckpointId, RuntimeKind, type CheckpointMeta } from '../types';

/** Checkpoint 6: "Matchday" — team+flag intro, players walking on, and true corners / throw-ins / goal kicks. */
export const REAL_GK_V5_META: CheckpointMeta = {
  id: CheckpointId.RealGkV5,
  title: 'Checkpoint 6 — Matchday',
  subtitle: 'Team intro with flags, players walking on, plus real corners, throw-ins & goal kicks',
  version: 'v5.0',
  createdAt: '2026-07-03',
  accent: 'realgk',
  runtime: RuntimeKind.RealGk,
};
