'use client';

import { type ReactNode } from 'react';
import { useLiveFeed } from '@/services/realtime/use-live-feed';
import { useDuelSync } from '@/hooks/use-duel-sync';
import { DuelLayout } from '@/enums/duel-layout.enum';
import { useDuelStore } from '@/store/duel.store';
import { DuelImmersive } from './duel-immersive';
import { DuelSplit } from './duel-split';
import { DuelResultDialog } from './duel-result-dialog';

// Branching is data, not control flow — pick the body by layout.
const LAYOUTS: Record<DuelLayout, ReactNode> = {
  [DuelLayout.Immersive]: <DuelImmersive />,
  [DuelLayout.Split]: <DuelSplit />,
};

/**
 * The duel arena chrome over the engine, in the selected layout. Feeds crowd + predictions via the mock
 * live feed. Rendered once (both bodies are responsive — split stacks on mobile) so only a single engine
 * loop is ever mounted; keyed by layout to remount + retrigger the hero-fade on switch.
 */
export function DuelDashboard() {
  useLiveFeed();
  useDuelSync();
  const layout = useDuelStore((s) => s.layout);

  return (
    <section key={layout} className="hero-fade relative min-h-screen w-full">
      {LAYOUTS[layout]}
      <DuelResultDialog />
    </section>
  );
}
