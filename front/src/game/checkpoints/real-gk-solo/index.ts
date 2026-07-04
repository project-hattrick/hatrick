import { CheckpointId, RuntimeKind, type CheckpointMeta } from '../types';

/** Solo court test: one controllable player + the field-calibration overlay (bounds, lines, spots). */
export const REAL_GK_SOLO_META: CheckpointMeta = {
  id: CheckpointId.RealGkSolo,
  title: 'Sandbox — Court Test',
  subtitle: 'One player (arrows/WASD, X shoot), pitch lines + out-of-play overlay for calibration',
  version: 'solo.1',
  createdAt: '2026-07-04',
  accent: 'realgk',
  runtime: RuntimeKind.RealGk,
};
