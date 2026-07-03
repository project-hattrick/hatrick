'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

// Matches the 3.3s CSS animations plus a short tail before the overlay unmounts.
const INTRO_DURATION_MS = 3400;

/** One-shot spotlight (holofote) loading intro that reveals the landing behind it. */
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

  return (
    <>
      <div className="landing-intro fixed inset-0 z-[70] grid place-items-center bg-black" role="status" aria-label="Loading">
        <Image
          src="/logo.png"
          alt="Hat-trick"
          width={472}
          height={481}
          priority
          className="landing-intro-logo h-auto w-[min(46vw,340px)] will-change-transform"
        />
      </div>
      <div className="landing-intro-spot pointer-events-none fixed inset-0 z-[71]" aria-hidden />
    </>
  );
}
