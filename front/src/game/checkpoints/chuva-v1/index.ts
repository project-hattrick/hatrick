import { STADIUM_PATHS } from '../../assets/manifest';
import { CameraMode, RainLevel, StadiumKey } from '../../enums';
import { CheckpointId, RuntimeKind, type CheckpointDef } from '../types';
import { CHUVA_CORNERS, CHUVA_FORMATIONS } from './config';

/** Checkpoint 1: faithful port of game_chuva.html — 2.5D sprite match in heavy rain. */
export const CHUVA_V1: CheckpointDef = {
  meta: {
    id: CheckpointId.ChuvaV1,
    title: 'Checkpoint 1 — Rain',
    subtitle: '2.5D sprite match, heavy rain & lightning',
    version: 'v1.0',
    createdAt: '2026-06-30',
    accent: 'rain',
    runtime: RuntimeKind.Shared,
  },
  field: { corners: CHUVA_CORNERS },
  formations: CHUVA_FORMATIONS,
  manifest: { stadium: STADIUM_PATHS[StadiumKey.RainCourt] },
  camera: CameraMode.Zoom23,
  rain: RainLevel.Strong,
  skipIntro: true,
};
