import { CANVAS, FIELD } from '../core/constants';
import type { ProjectFn, World } from '../core/types';
import { CameraMode, Phase } from '../enums';
import { clamp } from '../math/geometry';
import { TEAM_LABEL } from '../sim/events';

const CW = CANVAS.width;
const CH = CANVAS.height;
const INTRO_ZOOM = 0.12;

interface CameraSpec {
  label: string;
  zoom: number;
  follow: boolean;
}

export const CAMERAS: Record<CameraMode, CameraSpec> = {
  [CameraMode.Zoom23]: { label: 'CAMERA x2.3', zoom: 2.3, follow: true },
  [CameraMode.Zoom3]: { label: 'CAMERA x3', zoom: 3, follow: true },
  [CameraMode.Zoom17]: { label: 'CAMERA x1.7', zoom: 1.7, follow: true },
  [CameraMode.FullField]: { label: 'FULL PITCH', zoom: 1, follow: false },
};

const CAMERA_ORDER: CameraMode[] = [CameraMode.Zoom23, CameraMode.Zoom3, CameraMode.Zoom17, CameraMode.FullField];

export interface Camera {
  x: number;
  y: number;
  z: number;
  mode: CameraMode;
  zoom: number;
  follow: boolean;
}

export interface View {
  z: number;
  originX: number;
  originY: number;
}

export function createCamera(mode: CameraMode, startZoomed = false): Camera {
  const spec = CAMERAS[mode];
  return { x: CW / 2, y: CH / 2, z: startZoomed ? spec.zoom : INTRO_ZOOM, mode, zoom: spec.zoom, follow: spec.follow };
}

export function resetCamera(cam: Camera, startZoomed = false): void {
  cam.x = CW / 2;
  cam.y = CH / 2;
  cam.z = startZoomed ? cam.zoom : INTRO_ZOOM;
}

export function cycleCamera(cam: Camera): string {
  const next = CAMERA_ORDER[(CAMERA_ORDER.indexOf(cam.mode) + 1) % CAMERA_ORDER.length];
  const spec = CAMERAS[next];
  cam.mode = next;
  cam.zoom = spec.zoom;
  cam.follow = spec.follow;
  return spec.label;
}

export const cameraLabel = (cam: Camera): string => CAMERAS[cam.mode].label;

/** Smooths the camera toward the ball / target / center and returns the canvas transform. */
export function updateCamera(cam: Camera, world: World, project: ProjectFn): View {
  const { ball, players } = world;
  if (world.phase === Phase.Intro) {
    const pr = project(FIELD.width / 2, FIELD.height / 2);
    cam.x += (pr.x - cam.x) * 0.07;
    cam.y += (pr.y - cam.y) * 0.07;
    cam.z += (cam.zoom - cam.z) * 0.012;
  } else {
    let zt = cam.zoom;
    if (world.pausaGol > 0) zt = cam.zoom * 1.7;
    else if (ball.x < FIELD.width * 0.2 || ball.x > FIELD.width * 0.8) zt = cam.zoom * 1.25;
    cam.z += (zt - cam.z) * 0.08;

    const tgt = world.camTargetIdx >= 0 ? players[world.camTargetIdx] : null;
    if (tgt) {
      const bp = project(tgt.x, tgt.y);
      cam.x += (bp.x - cam.x) * 0.1;
      cam.y += (bp.y - cam.y) * 0.1;
    } else if (cam.follow || world.pausaGol > 0) {
      const bp = project(ball.x, ball.y);
      cam.x += (bp.x - cam.x) * 0.1;
      cam.y += (bp.y - cam.y) * 0.1;
    } else {
      cam.x += (CW / 2 - cam.x) * 0.1;
      cam.y += (CH / 2 - cam.y) * 0.1;
    }
  }

  const z = cam.z;
  if (z > 1) {
    const hw = CW / (2 * z);
    const hh = CH / (2 * z);
    cam.x = clamp(cam.x, hw, CW - hw);
    cam.y = clamp(cam.y, hh, CH - hh);
  }
  return { z, originX: CW / 2 - cam.x * z, originY: CH / 2 - cam.y * z };
}

/** Cycles the per-player camera target; -1 means follow the ball. Returns the HUD label. */
export function cycleTarget(world: World): string {
  world.camTargetIdx++;
  if (world.camTargetIdx >= world.players.length) world.camTargetIdx = -1;
  if (world.camTargetIdx < 0) return 'TARGET: BALL';
  const p = world.players[world.camTargetIdx];
  return `TARGET: ${TEAM_LABEL[p.team]} ${p.role}`;
}
