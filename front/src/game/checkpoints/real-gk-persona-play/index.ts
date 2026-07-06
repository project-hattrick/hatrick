import { CheckpointId, RuntimeKind, type CheckpointMeta } from '../types';

/** Playable persona sandbox: control two persona-headed teammates with the ball (pass/shoot/header). */
export const REAL_GK_PERSONA_PLAY_META: CheckpointMeta = {
  id: CheckpointId.RealGkPersonaPlay,
  title: 'Sandbox — Persona Playable',
  subtitle: 'Control two persona-headed teammates (arrows/WASD, Space pass, X shoot, C head, V trap) with the ball',
  version: 'persona-play.2',
  createdAt: '2026-07-06',
  accent: 'realgk',
  runtime: RuntimeKind.RealGk,
};
