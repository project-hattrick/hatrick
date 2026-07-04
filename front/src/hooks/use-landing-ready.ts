'use client';

import { useEffect, useState } from 'react';

import { resolveAssets } from '@/game/assets/loader';
import { HERO_CHECKPOINT, RuntimeKind, getCheckpointMeta, getSharedCheckpoint } from '@/game/checkpoints/registry';
import { loadRealGkAssets } from '@/game/realgk/assets/loader';

/** Hard cap so a stalled sprite/CDN can never trap the intro overlay on screen. */
const MAX_WAIT_MS = 10_000;

function imageSettled(img: HTMLImageElement): Promise<void> {
  if (img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

/** Walks a nested asset bundle and collects every HTMLImageElement inside it. */
function collectImages(node: unknown, out: HTMLImageElement[] = []): HTMLImageElement[] {
  if (node instanceof HTMLImageElement) out.push(node);
  else if (Array.isArray(node)) node.forEach((item) => collectImages(item, out));
  else if (node && typeof node === 'object') Object.values(node).forEach((item) => collectImages(item, out));
  return out;
}

/**
 * The exact Image objects the hero backdrop engine draws with — both loaders cache by src,
 * so this piggybacks on (or kicks off) the same requests instead of duplicating them.
 * `includeV4=true` mirrors the hero boot (REAL_GK_HERO_CONFIG defines `features`).
 */
function heroAssetImages(): HTMLImageElement[] {
  const isRealGk = getCheckpointMeta(HERO_CHECKPOINT).runtime === RuntimeKind.RealGk;
  return collectImages(isRealGk ? loadRealGkAssets(true) : resolveAssets(getSharedCheckpoint(HERO_CHECKPOINT).manifest));
}

const pageLoaded = (): Promise<void> =>
  document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true }));

/** Two rAFs = the frame after next, i.e. the landing has actually painted underneath the overlay. */
const nextPaint = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/**
 * True once the landing is actually renderable: page `load` (logo + eager images), fonts,
 * and every hero engine sprite settled, plus one paint tick — capped at MAX_WAIT_MS.
 */
export function useLandingReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const everything = Promise.all([
      pageLoaded(),
      document.fonts.ready,
      Promise.all(heroAssetImages().map(imageSettled)),
    ]).then(nextPaint);
    const cap = new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS));
    Promise.race([everything, cap]).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
