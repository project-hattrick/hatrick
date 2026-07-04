'use client';

/**
 * Very light retro-TV overlay: faint scanlines, a barely-there RGB aperture mask
 * and a soft edge vignette. Pure CSS gradients — no animation, no repaint cost.
 */
export function CrtOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background: [
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)',
          'repeating-linear-gradient(90deg, rgba(255,60,60,0.015) 0px, rgba(60,255,120,0.01) 1px, rgba(60,120,255,0.015) 2px, transparent 3px)',
          'radial-gradient(ellipse at center, transparent 68%, rgba(0,0,0,0.09) 100%)',
        ].join(', '),
      }}
    />
  );
}
