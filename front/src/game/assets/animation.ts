import { STRIDE } from '../core/constants';
import type { Animation, AnimationSpec } from './types';

/** Ticks per frame for a target fps (game runs at 60 ticks/s). */
export const stepFor = (fps: number): number => Math.max(1, Math.round(60 / fps));

/** Total ticks a one-shot animation plays for (used to time kicks, dives, tackles). */
export const animDuration = (spec: AnimationSpec): number => spec.frames * stepFor(spec.fps);

export function makeAnimation(images: HTMLImageElement[], spec: AnimationSpec): Animation {
  return { images, step: stepFor(spec.fps), scale: spec.scale, loop: spec.loop };
}

/** How a frame index is derived from time/motion. */
export enum FrameMode {
  OneShot = 'one-shot',
  Locomotion = 'locomotion',
  Loop = 'loop',
}

interface FrameCtx {
  len: number;
  step: number;
  tick: number;
  start: number;
  phase: number;
}

const PICK: Record<FrameMode, (c: FrameCtx) => number> = {
  [FrameMode.OneShot]: ({ len, step, tick, start }) => Math.min(len - 1, Math.max(0, Math.floor((tick - start) / step))),
  [FrameMode.Locomotion]: ({ len, phase }) => Math.floor(phase / STRIDE) % len,
  [FrameMode.Loop]: ({ len, step, tick }) => Math.floor(tick / step) % len,
};

export function pickFrameIndex(mode: FrameMode, ctx: FrameCtx): number {
  return PICK[mode](ctx);
}
