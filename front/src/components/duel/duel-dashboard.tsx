'use client';

import { useCallback, useState } from 'react';
import { useLiveFeed } from '@/services/realtime/use-live-feed';
import { useDuelDirector } from '@/hooks/use-duel-director';
import { useCrowdDirector } from '@/hooks/use-crowd-director';
import { DuelLayout } from '@/enums/duel-layout.enum';
import type { RealGkHandle } from '@/game/realgk/types';
import { useDuelStore } from '@/store/duel.store';
import { DuelImmersive } from './duel-immersive';
import { DuelSplit } from './duel-split';
import { DuelResultDialog } from './duel-result-dialog';

/**
 * The duel arena chrome over the engine, in the selected layout. The engine handle bubbles up from
 * RealGkBackground (onReady) so the duel director can drive the match (simulator beats + phases).
 * Feeds crowd + predictions via the mock live feed. Rendered once (both bodies are responsive — split
 * stacks on mobile) so only a single engine loop is ever mounted; keyed by layout to remount +
 * retrigger the hero-fade on switch.
 */
export function DuelDashboard() {
  useLiveFeed();
  useCrowdDirector();
  const layout = useDuelStore((s) => s.layout);
  const [handle, setHandle] = useState<RealGkHandle | null>(null);
  const onEngineReady = useCallback((h: RealGkHandle | null) => setHandle(h), []);
  useDuelDirector(handle);

  return (
    <section key={layout} className="hero-fade relative min-h-screen w-full">
      {layout === DuelLayout.Immersive ? <DuelImmersive onEngineReady={onEngineReady} /> : <DuelSplit onEngineReady={onEngineReady} />}
      <DuelResultDialog />
    </section>
  );
}
