'use client';

import { useEffect, type RefObject } from 'react';

/** Minimal engine surface this hook drives — any handle exposing an activity gate. */
interface Activatable {
  setActive: (active: boolean) => void;
}

/**
 * Stops a canvas engine's RAF loop whenever it can't be seen — the tab is hidden OR the
 * backdrop is scrolled out of the viewport — and resumes it when both are true again.
 * The engine renders 60fps even off-screen otherwise; this is the single biggest idle-CPU win.
 *
 * Wire it right after the engine boots: pass the container element and the live handle ref.
 */
export function useEngineActivity(
  containerRef: RefObject<HTMLElement | null>,
  handleRef: RefObject<Activatable | null>,
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let visible = !document.hidden;
    let onScreen = true;
    let applied: boolean | null = null;

    const apply = () => {
      const active = visible && onScreen;
      if (active === applied) return;
      applied = active;
      handleRef.current?.setActive(active);
    };

    const onVisibility = () => {
      visible = !document.hidden;
      apply();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Fires synchronously on observe, so it also seeds the initial on-screen state.
    const observer = new IntersectionObserver(
      (entries) => {
        onScreen = entries[entries.length - 1]?.isIntersecting ?? true;
        apply();
      },
      { threshold: 0.01 },
    );
    observer.observe(container);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      observer.disconnect();
      // No resume on teardown — the engine mounts/unmounts with this hook, and destroy() stops the loop.
    };
  }, [containerRef, handleRef]);
}
