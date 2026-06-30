'use client';

import { ReactLenis } from 'lenis/react';
import type { ReactNode } from 'react';

/** App-wide weighty smooth scroll. Drives native scroll, so sticky + scroll-timeline keep working. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.075, smoothWheel: true, wheelMultiplier: 1 }}>
      {children}
    </ReactLenis>
  );
}
