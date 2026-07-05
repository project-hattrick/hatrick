'use client';

import { type ReactNode } from 'react';
import { useLiveFeed } from '@/services/realtime/use-live-feed';
import { ImmersiveDashboard } from './immersive-dashboard';
import { SplitDashboard } from './split-dashboard';
import { HeroLayout } from '@/enums/hero-layout.enum';
import { useUiStore } from '@/store/ui.store';

// Branching is data, not control flow — pick the body by layout.
const LAYOUTS: Record<HeroLayout, ReactNode> = {
  [HeroLayout.Immersive]: <ImmersiveDashboard />,
  [HeroLayout.Split]: <SplitDashboard />,
};

/** First viewport: live widgets over the fullscreen stage, in the selected layout. */
export function LiveDashboard() {
  useLiveFeed();
  const heroLayout = useUiStore((state) => state.heroLayout);

  return (
    <section className="relative min-h-[90svh] w-full">
      <div className="h-full md:hidden">
        <ImmersiveDashboard />
      </div>
      <div key={heroLayout} className="hero-fade hidden h-full md:block">
        {LAYOUTS[heroLayout]}
      </div>
    </section>
  );
}
