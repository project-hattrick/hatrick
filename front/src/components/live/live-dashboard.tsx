'use client';

import { type ReactNode } from 'react';
import { useLiveFeed } from '@/services/realtime/use-live-feed';
import { useAutoReplay } from '@/hooks/use-auto-replay';
import { useAmbientCrowd } from '@/hooks/use-ambient-crowd';
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
  useAutoReplay();
  useAmbientCrowd();
  const heroLayout = useUiStore((state) => state.heroLayout);

  return (
    <section className="relative h-[96svh] min-h-[540px] w-full overflow-hidden">
      <div className="h-full md:hidden">
        <ImmersiveDashboard />
      </div>
      <div key={heroLayout} className="hero-fade hidden h-full md:block">
        {LAYOUTS[heroLayout]}
      </div>
    </section>
  );
}
