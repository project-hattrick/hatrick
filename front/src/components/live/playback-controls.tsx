'use client';

import { Play, Pause, SpeakerHigh, SpeakerSlash, ArrowsOut, Rectangle } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { IconButton } from '@/components/common/icon-button';
import { DimensionToggle } from './dimension-toggle';
import { HeroLayout } from '@/enums/hero-layout.enum';
import { useUiStore } from '@/store/ui.store';

// The match backdrop lives outside the dashboard section (parallax stage),
// so fullscreen targets the whole page to keep the game visible behind the HUD.
function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen();
}

/** Top-left controls: dimension switch + transport buttons + layout toggle. */
export function PlaybackControls() {
  const playing = useUiStore((state) => state.playing);
  const muted = useUiStore((state) => state.muted);
  const heroLayout = useUiStore((state) => state.heroLayout);
  const togglePlaying = useUiStore((state) => state.togglePlaying);
  const toggleMuted = useUiStore((state) => state.toggleMuted);
  const toggleHeroLayout = useUiStore((state) => state.toggleHeroLayout);

  return (
    <div className="flex items-center gap-3">
      <GlassPanel radius="lg" className="p-1">
        <DimensionToggle />
      </GlassPanel>
      <GlassPanel radius="lg" className="flex items-center gap-1 px-2 py-1">
        <IconButton size="icon-sm" label={playing ? 'Pause' : 'Play'} onClick={togglePlaying}>
          {playing ? <Pause /> : <Play />}
        </IconButton>
        <IconButton size="icon-sm" label={muted ? 'Unmute' : 'Mute'} onClick={toggleMuted}>
          {muted ? <SpeakerSlash /> : <SpeakerHigh />}
        </IconButton>
        <span className="mx-1 h-4 w-px bg-border" />
        <IconButton size="icon-sm" label="Fullscreen" onClick={toggleFullscreen}>
          <ArrowsOut />
        </IconButton>
      </GlassPanel>
      <GlassPanel radius="lg" className="px-1 py-1">
        <button
          type="button"
          onClick={toggleHeroLayout}
          aria-pressed={heroLayout === HeroLayout.Split}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground transition hover:text-foreground"
        >
          <Rectangle className="size-4" />
          {heroLayout === HeroLayout.Split ? 'Immersive' : 'Split view'}
        </button>
      </GlassPanel>
    </div>
  );
}
