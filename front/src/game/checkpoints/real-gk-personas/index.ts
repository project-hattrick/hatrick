import { CheckpointId, RuntimeKind, type CheckpointMeta } from '../types';

/** Full match cast with distinct characters: headless bodies + per-persona composited heads (no baked face). */
export const REAL_GK_PERSONAS_META: CheckpointMeta = {
  id: CheckpointId.RealGkPersonas,
  title: 'Sandbox — Persona Match',
  subtitle: 'Full 11-a-side match where every player wears a distinct persona head (headless body + composited face)',
  version: 'personas.1',
  createdAt: '2026-07-05',
  accent: 'realgk',
  runtime: RuntimeKind.RealGk,
};
