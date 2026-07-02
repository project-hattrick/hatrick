'use client';

import { useEffect, type ReactNode } from 'react';
import { useLiveFeed } from '@/services/realtime/use-live-feed';
import { ImmersiveDashboard } from './immersive-dashboard';
import { SplitDashboard } from './split-dashboard';
import { HeroLayout } from '@/enums/hero-layout.enum';
import { useUiStore } from '@/store/ui.store';
import { startCrowdAmbience, stopCrowdAmbience } from '@/lib/crowd-ambience';

// Branching is data, not control flow — pick the body by layout.
const LAYOUTS: Record<HeroLayout, ReactNode> = {
  [HeroLayout.Immersive]: <ImmersiveDashboard />,
  [HeroLayout.Split]: <SplitDashboard />,
};

/** First viewport: live widgets over the fullscreen stage, in the selected layout. */
export function LiveDashboard() {
  useLiveFeed();
  const heroLayout = useUiStore((state) => state.heroLayout);
  const playing = useUiStore((state) => state.playing);
  const muted = useUiStore((state) => state.muted);

  // Crowd ambience follows the play + mute buttons.
  useEffect(() => {
    if (playing && !muted) startCrowdAmbience();
    else stopCrowdAmbience();
  }, [playing, muted]);
  useEffect(() => stopCrowdAmbience, []);

  return (
    <section className="relative min-h-screen w-full">
      <div className="h-full md:hidden">
        <ImmersiveDashboard />
      </div>
      <div key={heroLayout} className="hero-fade hidden h-full md:block">
        {LAYOUTS[heroLayout]}
      </div>
    </section>
  );
}
