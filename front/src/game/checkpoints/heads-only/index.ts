import { CheckpointId, RuntimeKind, type CheckpointMeta } from '../types';

/** Top-view head-only sandbox: full-bleed pitch, 11-v-11 persona faces, real-match AI + FX. */
export const HEADS_ONLY_META: CheckpointMeta = {
  id: CheckpointId.HeadsOnly,
  title: 'Sandbox - Heads Only',
  subtitle: 'Full-pitch 11-v-11 with randomized pass-first AI, kick dust, shot pulse and slow-mo',
  version: 'heads.3',
  createdAt: '2026-07-07',
  accent: 'realgk',
  runtime: RuntimeKind.HeadsOnly,
};
