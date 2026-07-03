import { CheckpointId, RuntimeKind, type CheckpointMeta } from '../types';

/** Playable sandbox: two same-team players you control (pass to switch), plus referee + coach. */
export const REAL_GK_PLAY_META: CheckpointMeta = {
  id: CheckpointId.RealGkPlay,
  title: 'Sandbox — Playable',
  subtitle: 'Control two teammates (arrows/WASD, Space pass, X shoot), referee + coach',
  version: 'play.1',
  createdAt: '2026-07-03',
  accent: 'realgk',
  runtime: RuntimeKind.RealGk,
};
