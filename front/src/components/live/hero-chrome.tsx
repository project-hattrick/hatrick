'use client';

import { type ReactNode } from 'react';
import { useHeroImpactActive } from '@/store/real-gk.store';
import { cn } from '@/lib/utils';

/**
 * Wraps the hero overlay (scoreboard, event chips, prediction dock, cards…) so it dissolves during a
 * cinematic beat — goal, replay or red card — letting the match fill the screen, then fades back once
 * the beat clears. A static wrapper: its absolute children still anchor to the positioned dashboard root.
 */
export function HeroChrome({ children, className }: { children: ReactNode; className?: string }) {
  const impact = useHeroImpactActive();
  return (
    <div
      aria-hidden={impact}
      className={cn(
        'transition-opacity duration-500 ease-out motion-reduce:transition-none',
        impact ? 'pointer-events-none opacity-0' : 'opacity-100',
        className,
      )}
    >
      {children}
    </div>
  );
}
