import { CheckpointId, RuntimeKind, type CheckpointMeta } from '../types';

/** Auto full match: the playable-sandbox look, but 11-a-side AI with goal replays. */
export const REAL_GK_MATCH_META: CheckpointMeta = {
  id: CheckpointId.RealGkMatch,
  title: 'Sandbox — Full Match',
  subtitle: 'Same look as the sandbox, fully automatic 11-a-side with goal replays',
  version: 'match.1',
  createdAt: '2026-07-03',
  accent: 'realgk',
  runtime: RuntimeKind.RealGk,
};
