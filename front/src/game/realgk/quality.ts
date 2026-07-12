/**
 * Device render-quality tier for the canvas engine. Detected once at boot and shared (module-global,
 * since it's a property of the device, not a variant) by the loop, the renderer and the effects sim.
 * Weak/mobile devices cap the retina buffer, thin out particles and drop the ambient dusk shadows so a
 * full-bleed hero stays fluid; capable machines keep the full look.
 */
export interface QualityTier {
  /** Ceiling for `devicePixelRatio` when sizing the canvas backing store. */
  dprCap: number;
  /** Max simultaneous ball/turf particles kept alive. */
  maxParticles: number;
  /** Whether the blurred ambient court shadows are drawn (expensive `ctx.filter` blur). */
  softShadows: boolean;
}

const FULL: QualityTier = { dprCap: 2, maxParticles: 96, softShadows: true };
const LOW: QualityTier = { dprCap: 1.5, maxParticles: 36, softShadows: false };

let current: QualityTier = FULL;

/** Picks a tier from CPU cores + a coarse pointer on a small viewport (SSR-safe: assumes full). */
export function detectQualityTier(): QualityTier {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return FULL;
  const cores = navigator.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const smallViewport = window.innerWidth < 820;
  const lowEnd = cores <= 4 || (coarse && smallViewport);
  return lowEnd ? LOW : FULL;
}

/** Sets the active tier (called once at engine boot). */
export function setQualityTier(tier: QualityTier): void {
  current = tier;
}

/** The active render-quality tier. */
export function quality(): QualityTier {
  return current;
}
