'use client';

import { type ReactNode } from 'react';

import { useHeroImpactActive } from '@/store/real-gk.store';
import { cn } from '@/lib/utils';

type SlideDirection = 'up' | 'down' | 'right';

/** TW4: translate-* animates via the `translate` property — transition it explicitly. */
const OFFSCREEN: Record<SlideDirection, string> = {
  up: '-translate-y-[130%]',
  down: 'translate-y-[130%]',
  right: 'translate-x-[130%]',
};

/**
 * Slides its content off-screen during a cinematic beat (goal, replay, red card)
 * and back afterwards. Unlike HeroChrome (which fades EVERYTHING), this wraps
 * only the bet surfaces so the rest of the room stays visible. This component IS
 * the positioned container — pass the anchor classes via className.
 */
export function ImpactSlide({
  children,
  direction = 'down',
  className,
}: {
  children: ReactNode;
  direction?: SlideDirection;
  className?: string;
}) {
  const impact = useHeroImpactActive();
  return (
    <div
      aria-hidden={impact}
      className={cn(
        'transition-[translate,opacity] duration-500 ease-out motion-reduce:transition-none',
        impact ? cn(OFFSCREEN[direction], 'pointer-events-none opacity-0') : 'opacity-100',
        className,
      )}
    >
      {children}
    </div>
  );
}
