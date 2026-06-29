'use client';

import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { GlassPanel } from '@/components/common/glass-panel';
import { IconButton } from '@/components/common/icon-button';
import { DimensionToggle } from './dimension-toggle';
import { useUiStore } from '@/store/ui.store';

/** Top-left controls: dimension switch + transport buttons. */
export function PlaybackControls() {
  const playing = useUiStore((state) => state.playing);
  const muted = useUiStore((state) => state.muted);
  const togglePlaying = useUiStore((state) => state.togglePlaying);
  const toggleMuted = useUiStore((state) => state.toggleMuted);

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
          {muted ? <VolumeX /> : <Volume2 />}
        </IconButton>
        <span className="mx-1 h-4 w-px bg-border" />
        <IconButton size="icon-sm" label="Fullscreen">
          <Maximize />
        </IconButton>
      </GlassPanel>
    </div>
  );
}
