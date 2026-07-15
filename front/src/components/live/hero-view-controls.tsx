'use client';

import { ArrowsOut, Rectangle } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { IconButton } from '@/components/common/icon-button';
import { HeroLayout } from '@/enums/hero-layout.enum';
import { useUiStore } from '@/store/ui.store';

// The match backdrop is the parallax stage behind the HUD, so fullscreen targets the
// whole page to keep the pitch visible under the controls.
function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen();
}

/**
 * Stage view controls: split/immersive layout and fullscreen.
 * Rendered bare inside the timeline bar (`standalone={false}`); wrapped in its own
 * glass pill when it stands alone — pre-match, where the replay bar is hidden and
 * these controls relocate to a corner.
 */
export function HeroViewControls({ standalone = false }: { standalone?: boolean }) {
  const heroLayout = useUiStore((state) => state.heroLayout);
  const toggleHeroLayout = useUiStore((state) => state.toggleHeroLayout);

  const controls = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleHeroLayout}
        aria-pressed={heroLayout === HeroLayout.Split}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold text-muted-foreground transition hover:text-foreground"
      >
        <Rectangle className="size-4" />
        {heroLayout === HeroLayout.Split ? 'Immersive' : 'Split'}
      </button>
      <IconButton size="icon-sm" label="Fullscreen" onClick={toggleFullscreen}>
        <ArrowsOut />
      </IconButton>
    </div>
  );

  if (!standalone) return controls;

  return (
    <GlassPanel tone="dark" radius="xl" className="pointer-events-auto flex items-center px-2 py-1.5">
      {controls}
    </GlassPanel>
  );
}
