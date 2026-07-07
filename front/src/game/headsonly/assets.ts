import { BALL_FRAMES, HeadView, PERSONA_COUNT, type Assets, type HeadSet } from './types';

/** Persona head file stems — only `side_right` ships; left-facing mirrors it at draw time. */
const VIEW_FILE: Record<HeadView, string> = {
  [HeadView.Front]: 'front',
  [HeadView.Back]: 'back',
  [HeadView.Side]: 'side_right',
};

function loadImage(src: string): HTMLImageElement {
  const img = new Image();
  img.src = src;
  return img;
}

function personaPath(index: number, view: HeadView): string {
  const n = String(index + 1).padStart(2, '0');
  return `/game/personas/heads/p${n}_head_${VIEW_FILE[view]}.png`;
}

/** Load the 11 persona head sets (p01..p11) + the 19-frame rolling ball. */
export function loadAssets(): Assets {
  const heads: HeadSet[] = [];
  for (let i = 0; i < PERSONA_COUNT; i++) {
    heads.push({
      [HeadView.Front]: loadImage(personaPath(i, HeadView.Front)),
      [HeadView.Back]: loadImage(personaPath(i, HeadView.Back)),
      [HeadView.Side]: loadImage(personaPath(i, HeadView.Side)),
    });
  }
  const ball: HTMLImageElement[] = [];
  for (let f = 0; f < BALL_FRAMES; f++) {
    ball.push(loadImage(`/game/ball/frames/ball-${String(f).padStart(2, '0')}.png`));
  }
  return { heads, ball };
}
