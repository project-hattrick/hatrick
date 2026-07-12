'use client';

import { type ReactNode } from 'react';
import { useLiveFeed } from '@/services/realtime/use-live-feed';
import { useGlobalFeed } from '@/services/realtime/use-global-feed';
import { useAutoReplay } from '@/hooks/use-auto-replay';
import { useCrowdDirector } from '@/hooks/use-crowd-director';
import { useRecapFallback } from '@/hooks/use-recap-fallback';
import { useGlobalPicksDriver } from '@/components/home/live-hero/use-global-picks-driver';
import { GlobalLiveImmersive } from '@/components/home/live-hero/global-live-immersive';
import { GlobalLiveSplit } from '@/components/home/live-hero/global-live-split';
import { HeroLayout } from '@/enums/hero-layout.enum';
import { useUiStore } from '@/store/ui.store';

// Branching is data, not control flow — pick the body by layout.
const LAYOUTS: Record<HeroLayout, ReactNode> = {
  [HeroLayout.Immersive]: <GlobalLiveImmersive />,
  [HeroLayout.Split]: <GlobalLiveSplit />,
};

/**
 * First viewport: the room's watch-party experience, made public — a global live
 * betting view over the fullscreen stage. Bet rail, headline 1·X·2 dock, public
 * backers + pick toast, mini watcher and a stats/crowd rail, in the selected layout.
 */
export function LiveDashboard() {
  useLiveFeed();
  useGlobalFeed();
  useAutoReplay();
  useCrowdDirector();
  useRecapFallback();
  useGlobalPicksDriver();
  const heroLayout = useUiStore((state) => state.heroLayout);

  return (
    <section className="relative h-[96svh] min-h-[540px] w-full overflow-hidden">
      <div className="h-full md:hidden">
        <GlobalLiveImmersive />
      </div>
      <div key={heroLayout} className="hero-fade hidden h-full md:block">
        {LAYOUTS[heroLayout]}
      </div>
    </section>
  );
}
