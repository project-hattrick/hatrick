import { CheckpointId, RuntimeKind, type CheckpointMeta } from '../types';

/** Focused ball-effects playground with a repeatable high drop and playable shooting. */
export const EFFECTS_LAB_META: CheckpointMeta = {
  id: CheckpointId.EffectsLab,
  title: 'Sandbox — Effects Lab',
  subtitle: 'Ball impact particles: dust bloom, turf flecks and a repeatable drop (L)',
  version: 'fx.1',
  createdAt: '2026-07-05',
  accent: 'effects',
  runtime: RuntimeKind.RealGk,
};
