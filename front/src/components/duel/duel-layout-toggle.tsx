'use client';

import { Rectangle } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { DuelLayout } from '@/enums/duel-layout.enum';
import { useDuelStore } from '@/store/duel.store';

/** Immersive ↔ split-view switch for the duel arena (mirrors the hero's layout toggle). */
export function DuelLayoutToggle() {
  const layout = useDuelStore((s) => s.layout);
  const toggleLayout = useDuelStore((s) => s.toggleLayout);

  return (
    <GlassPanel radius="lg" className="pointer-events-auto px-1 py-1">
      <button
        type="button"
        onClick={toggleLayout}
        aria-pressed={layout === DuelLayout.Split}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold text-muted-foreground transition hover:text-foreground"
      >
        <Rectangle className="size-4" />
        {layout === DuelLayout.Split ? 'Immersive' : 'Split view'}
      </button>
    </GlassPanel>
  );
}
