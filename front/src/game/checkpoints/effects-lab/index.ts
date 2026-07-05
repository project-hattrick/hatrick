import { CheckpointId, RuntimeKind, type CheckpointMeta } from '../types';

/** Focused ball-effects playground with a repeatable high drop and playable shooting. */
export const EFFECTS_LAB_META: CheckpointMeta = {
  id: CheckpointId.EffectsLab,
  title: 'Sandbox — Effects Lab',
  subtitle: 'Power Arc shots plus dust, turf flecks, a repeatable ball drop and slow-mo shots',
  version: 'fx.4',
  createdAt: '2026-07-05',
  accent: 'effects',
  runtime: RuntimeKind.RealGk,
};
