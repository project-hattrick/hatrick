'use client';

import { useEffect, useState } from 'react';

import { HolofoteLoader } from '@/components/common/holofote-loader';

// Matches the 2.2s intro-out animation plus a short tail before the overlay unmounts.
const INTRO_DURATION_MS = 2300;

/** One-shot pulsing holofote intro (same visual as the route loader), then reveals the landing. */
export function LandingIntro() {
  // Start visible so the overlay is painted on the very first frame (SSR + hydration),
  // ahead of the landing. The effect then plays it out, or removes it for reduced motion.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Reduced motion skips the animation — hide on the next tick (0ms) instead of
    // synchronously, so the effect never sets state in its own body.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setVisible(false), reduced ? 0 : INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  // The wrapper's opacity fade (intro-out) applies to the fixed holofote layers underneath.
  return (
    <div className="landing-intro" role="status" aria-label="Loading">
      <HolofoteLoader />
    </div>
  );
}
