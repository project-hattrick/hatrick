import { STADIUM_PATHS } from '../../assets/manifest';
import { CameraMode, RainLevel, StadiumKey } from '../../enums';
import { RAIN_COURT_CORNERS, STANDARD_FORMATIONS } from '../shared';
import { CheckpointId, RuntimeKind, type CheckpointDef } from '../types';

/** Checkpoint 2: clear-night showcase — same engine, no rain, wider camera. Used as the hero backdrop. */
export const ARENA_V1: CheckpointDef = {
  meta: {
    id: CheckpointId.ArenaV1,
    title: 'Checkpoint 2 — Arena',
    subtitle: 'Clear-night showcase match',
    version: 'v1.0',
    createdAt: '2026-06-30',
    accent: 'arena',
    runtime: RuntimeKind.Shared,
  },
  field: { corners: RAIN_COURT_CORNERS },
  formations: STANDARD_FORMATIONS,
  manifest: { stadium: STADIUM_PATHS[StadiumKey.RainCourt] },
  camera: CameraMode.Zoom17,
  rain: RainLevel.Off,
  skipIntro: true,
};
