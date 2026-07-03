'use client';

import { useEffect, useState } from 'react';

import { HolofoteLoader } from '@/components/common/holofote-loader';

// Matches the 3.3s intro-out animation plus a short tail before the overlay unmounts.
const INTRO_DURATION_MS = 3400;

/** One-shot pulsing holofote intro (same visual as the route loader), then reveals the landing. */
export function LandingIntro() {
  // Start visible so the overlay is painted on the very first frame (SSR + hydration),
  // ahead of the landing. The effect then plays it out, or removes it for reduced motion.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(false), INTRO_DURATION_MS);
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
