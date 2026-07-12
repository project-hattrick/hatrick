'use client';

import { useEffect, useState } from 'react';

import { resolveAssets } from '@/game/assets/loader';
import { HERO_CHECKPOINT, RuntimeKind, getCheckpointMeta, getSharedCheckpoint } from '@/game/checkpoints/registry';
import { loadRealGkAssets } from '@/game/realgk/assets/loader';

/** Hard cap so a stalled sprite/CDN can never trap the intro overlay on screen (kept low for mobile). */
const MAX_WAIT_MS = 6_000;
/** `window.load` regularly stalls on mobile (a resource that never fires load) — cap our wait on it. */
const PAGE_LOAD_SOFT_MS = 2_500;

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
 * `includeV4=true` mirrors the hero boot (REAL_GK_MATCH_CONFIG defines `features`).
 */
function heroAssetImages(): HTMLImageElement[] {
  const isRealGk = getCheckpointMeta(HERO_CHECKPOINT).runtime === RuntimeKind.RealGk;
  return collectImages(isRealGk ? loadRealGkAssets(true) : resolveAssets(getSharedCheckpoint(HERO_CHECKPOINT).manifest));
}

const pageLoaded = (): Promise<void> =>
  document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((resolve) => window.addEventListener('load', () => resolve(), { once: true }));

/** `window.load` but best-effort: it contributes to readiness yet can't stall it (common on mobile). */
const softPageLoaded = (): Promise<void> =>
  Promise.race([pageLoaded(), new Promise<void>((resolve) => window.setTimeout(resolve, PAGE_LOAD_SOFT_MS))]);

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
    let capId = 0;
    const finish = () => {
      if (cancelled) return;
      window.clearTimeout(capId);
      setReady(true);
    };

    // Hard cap armed FIRST so a hang (page `load`/fonts that never resolve) still lifts the overlay.
    capId = window.setTimeout(finish, MAX_WAIT_MS);

    // Collecting the hero sprites runs synchronously and could throw if an engine module blows up on
    // a given device — wrap it in the promise chain so a throw becomes a rejection we recover from
    // (…finish, finish) instead of stranding the effect and trapping the intro overlay forever.
    Promise.resolve()
      .then(() =>
        Promise.all([softPageLoaded(), document.fonts.ready, Promise.all(heroAssetImages().map(imageSettled))]),
      )
      .then(nextPaint)
      .then(finish, finish);

    return () => {
      cancelled = true;
      window.clearTimeout(capId);
    };
  }, []);

  return ready;
}
