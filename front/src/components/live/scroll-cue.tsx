'use client';

import { useEffect, useState } from 'react';
import { CaretDown } from '@/components/common/icons';
import { cn } from '@/lib/utils';

// Past this scroll depth the affordance has done its job, so it fades out.
const HIDE_AFTER_PX = 48;

/**
 * Desktop scroll affordance for the hero: a small bouncing caret + label pinned to the
 * hero's bottom edge, pointing at the live scoreboard peeking below the fold. It fades the
 * moment the user starts scrolling and stays hidden. Desktop-only — on mobile the peek is
 * cue enough and the prediction dock owns the bottom-centre space.
 */
export function ScrollCue() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < HIDE_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-1 z-10 hidden justify-center transition-opacity duration-500 md:flex',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <span className="flex flex-col items-center gap-0.5 text-muted-foreground motion-safe:animate-bounce">
        <span className="font-mono text-eyebrow tracking-widest uppercase">Scroll</span>
        <CaretDown weight="bold" className="text-base" />
      </span>
    </div>
  );
}
