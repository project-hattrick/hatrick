'use client';

import { useEffect, useState } from 'react';
import { useLenis } from 'lenis/react';

import { HolofoteLoader } from '@/components/common/holofote-loader';
import { useLandingReady } from '@/hooks/use-landing-ready';
import { cn } from '@/lib/utils';

/** Overlay pulses at least this long so a warm cache doesn't flash-skip the brand beat. */
const MIN_HOLD_MS = 900;
/** Matches the .landing-intro--out fade in globals.css, plus a short tail before unmount. */
const OUT_DURATION_MS = 900;

enum IntroPhase {
  Hold = 'hold',
  Out = 'out',
  Done = 'done',
}

/**
 * Holofote intro that stays up until the landing underneath is actually ready
 * (hero engine sprites, fonts, page load — see useLandingReady), then fades out.
 */
export function LandingIntro() {
  // Start on Hold so the overlay is painted on the very first frame (SSR + hydration),
  // ahead of the landing revealing beneath it.
  const [phase, setPhase] = useState(IntroPhase.Hold);
  const [held, setHeld] = useState(false);
  const ready = useLandingReady();
  const lenis = useLenis();

  // Lock scrolling while the overlay is up: the landing (and its hero engine) must not be scrollable
  // behind the loader. Stops Lenis (which adds `.lenis-stopped { overflow: hidden }`) and pins the
  // root overflow as a fallback for the frames before Lenis is ready or on touch devices.
  useEffect(() => {
    if (phase === IntroPhase.Done) return;
    lenis?.stop();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      lenis?.start();
      root.style.overflow = previous;
    };
  }, [lenis, phase]);

  useEffect(() => {
    // Reduced motion skips the minimum brand beat — the overlay is then purely a readiness gate.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setHeld(true), reduced ? 0 : MIN_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // Only fade once the landing is painted AND the minimum beat has played.
  useEffect(() => {
    if (!ready || !held || phase !== IntroPhase.Hold) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPhase(reduced ? IntroPhase.Done : IntroPhase.Out);
  }, [ready, held, phase]);

  useEffect(() => {
    if (phase !== IntroPhase.Out) return;
    const timer = window.setTimeout(() => setPhase(IntroPhase.Done), OUT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === IntroPhase.Done) return null;

  return (
    <div
      className={cn('landing-intro', phase === IntroPhase.Out && 'landing-intro--out')}
      role="status"
      aria-label="Loading"
    >
      <HolofoteLoader />
    </div>
  );
}
