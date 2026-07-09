'use client';

import { useState } from 'react';

import { GlassPanel } from '@/components/common/glass-panel';
import { IconButton } from '@/components/common/icon-button';
import { Play, Pause, ArrowsOut, Rectangle, Lightning, ClockCounterClockwise } from '@/components/common/icons';
import { DimensionToggle } from './dimension-toggle';
import { useDisplayMatch, useIsMatchLive } from '@/store/match.store';
import { useReplayPlaybackStore } from '@/store/replay-playback.store';
import { useHeroControls, useHeroEngineStore } from '@/store/hero-engine.store';
import { useRealGkStore } from '@/store/real-gk.store';
import { useUiStore } from '@/store/ui.store';
import { HeroLayout } from '@/enums/hero-layout.enum';
import { formatMinute } from '@/lib/format';
import { cn } from '@/lib/utils';

const FALLBACK_TOTAL = 95;
const clampPct = (minute: number, total: number) => Math.max(0, Math.min(100, (minute / total) * 100));

// Marker colour by raw wire action.
const MARKER_CLASS: Record<string, string> = {
  goal: 'bg-neon',
  penalty: 'bg-neon',
  yellow_card: 'bg-chart-4',
  red_card: 'bg-live',
  corner: 'bg-team-home',
};

function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen();
}

/**
 * The single hero playback surface. When a replay is loaded it drives the front-driven playback
 * store — a real draggable scrubber (seek anywhere), play/pause, speed and restart — with markers at
 * the real event minutes. Without a replay it falls back to a live playhead + engine controls.
 */
export function MatchTimeline() {
  const match = useDisplayMatch();
  const isLive = useIsMatchLive();
  const timeline = useReplayPlaybackStore((state) => state.timeline);
  const cursor = useReplayPlaybackStore((state) => state.cursor);
  const pbPlaying = useReplayPlaybackStore((state) => state.playing);
  const pbSpeed = useReplayPlaybackStore((state) => state.speed);

  const controls = useHeroControls();
  const reload = useHeroEngineStore((state) => state.reload);
  const engineSpeed = useRealGkStore((state) => state.speed);
  const uiPlaying = useUiStore((state) => state.playing);
  const togglePlaying = useUiStore((state) => state.togglePlaying);
  const heroLayout = useUiStore((state) => state.heroLayout);
  const toggleHeroLayout = useUiStore((state) => state.toggleHeroLayout);
  const [liveCursor, setLiveCursor] = useState<number | null>(null);

  const hasReplay = timeline !== null;
  const total = timeline?.durationMin ?? FALLBACK_TOTAL;
  const position = hasReplay ? cursor : liveCursor ?? (isLive ? match.minute : FALLBACK_TOTAL);
  const playing = hasReplay ? pbPlaying : uiPlaying;
  const speed = hasReplay ? pbSpeed : engineSpeed;

  const onSeek = (minute: number) => {
    if (hasReplay) useReplayPlaybackStore.getState().setCursor(minute);
    else setLiveCursor(minute);
  };
  const onTogglePlay = () => {
    if (hasReplay) useReplayPlaybackStore.getState().toggle();
    else togglePlaying();
  };
  const onSpeed = () => {
    if (hasReplay) useReplayPlaybackStore.getState().cycleSpeed();
    else controls?.cycleSpeed();
  };
  const onRestart = () => {
    if (hasReplay) useReplayPlaybackStore.getState().restart();
    else reload();
    if (!hasReplay && !uiPlaying) togglePlaying();
  };

  return (
    <GlassPanel tone="dark" radius="xl" className="pointer-events-auto flex items-center gap-3 px-3 py-2">
      <IconButton size="icon-sm" label={playing ? 'Pause' : 'Play'} onClick={onTogglePlay}>
        {playing ? <Pause /> : <Play />}
      </IconButton>

      <IconButton size="icon-sm" label="Restart from kickoff" onClick={onRestart}>
        <ClockCounterClockwise />
      </IconButton>

      <button
        type="button"
        onClick={onSpeed}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs font-semibold text-muted-foreground transition hover:border-neon hover:text-foreground"
        aria-label="Cycle speed"
      >
        <Lightning className="size-3.5" />
        {speed ? `${speed}×` : '1×'}
      </button>

      {/* Draggable scrubber — seek anywhere; markers at the real event minutes. */}
      <div className="relative flex min-w-0 flex-1 items-center">
        <input
          type="range"
          min={0}
          max={total}
          step={1}
          value={Math.round(position)}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Match timeline"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-neon"
        />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
          {(timeline?.events ?? []).map((event, index) => {
            const teamCode = event.participant === 2 ? match.away.code : match.home.code;
            return (
              <span
                key={`${event.minute}-${event.action}-${index}`}
                title={`${formatMinute(event.minute)} · ${event.action} (${teamCode})`}
                className={cn(
                  'absolute size-2 -translate-x-1/2 rounded-full ring-2 ring-black/40',
                  MARKER_CLASS[event.action] ?? 'bg-muted-foreground',
                )}
                style={{ left: `${clampPct(event.minute, total)}%` }}
              />
            );
          })}
        </div>
      </div>

      <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-muted-foreground">
        {Math.round(position)}&apos;
      </span>

      <span className="mx-0.5 hidden h-5 w-px bg-border sm:block" />

      <div className="hidden items-center gap-2 sm:flex">
        <DimensionToggle />
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
    </GlassPanel>
  );
}
