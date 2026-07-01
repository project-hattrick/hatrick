import { CheckpointId } from '../checkpoints/types';

/** A follow-camera preset in the cycle ring. */
export interface CamPreset {
  label: string;
  zoom: number;
  follow: boolean;
}

/**
 * Tunables that define a Real Match GK *variant*. The engine, sim and renderer are shared; a config
 * is what makes "Cinema" feel bigger than "v2": a larger virtual pitch (players cover more ground, so
 * they read as smaller and cross slower) plus tighter sprites and a dramatic, dynamically-zooming camera.
 */
export interface RealGkConfig {
  /** Virtual pitch size as a multiple of the viewport. 1 = pitch fits the screen; >1 = the camera pans a larger field. */
  fieldScale: number;
  /** Sprite height range (far → near), in field pixels. Smaller = tinier players on a vaster pitch. */
  spriteMinH: number;
  spriteMaxH: number;
  /** Camera preset ring (first entry is the default). */
  presets: CamPreset[];
  /** Cinematic camera: eases slower, leads the ball, and pushes in on shots / near-goal action. */
  cinematic: boolean;
}

/** Checkpoint 3 — the original Real Match GK feel. Pitch fits the screen 1:1. */
export const REAL_GK_V2_CONFIG: RealGkConfig = {
  fieldScale: 1,
  spriteMinH: 35,
  spriteMaxH: 58,
  presets: [
    { label: 'Broadcast', zoom: 1.9, follow: true },
    { label: 'Close', zoom: 2.6, follow: true },
    { label: 'Wide', zoom: 1.4, follow: true },
    { label: 'Full pitch', zoom: 1.0, follow: false },
  ],
  cinematic: false,
};

/** Checkpoint 4 — "Cinema": a large pitch the camera roams, small players, dramatic dynamic zoom. */
export const REAL_GK_CINEMA_CONFIG: RealGkConfig = {
  fieldScale: 1.85,
  spriteMinH: 22,
  spriteMaxH: 38,
  presets: [
    { label: 'Cinematic', zoom: 1.2, follow: true },
    { label: 'Tight', zoom: 1.75, follow: true },
    { label: 'Aerial', zoom: 0.82, follow: true },
    { label: 'Full pitch', zoom: 0.55, follow: false },
  ],
  cinematic: true,
};

/** Resolves the variant config for a RealGk checkpoint id (defaults to v2). */
export function realGkConfigFor(id: CheckpointId): RealGkConfig {
  return id === CheckpointId.RealGkV3 ? REAL_GK_CINEMA_CONFIG : REAL_GK_V2_CONFIG;
}
