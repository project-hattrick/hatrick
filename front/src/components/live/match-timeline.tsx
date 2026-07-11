'use client';

import { GlassPanel } from '@/components/common/glass-panel';
import { IconButton } from '@/components/common/icon-button';
import { Play, Pause, Lightning, ClockCounterClockwise } from '@/components/common/icons';
import { HeroViewControls } from './hero-view-controls';
import { useDisplayMatch, useIsEnded, useIsInPlay, useIsReplay, useMatch, useMatchEvents } from '@/store/match.store';
import { useLiveMinute } from '@/hooks/use-live-minute';
import { useReplaySessionStore } from '@/store/replay-session.store';
import { useHeroControls } from '@/store/hero-engine.store';
import { useRealGkStore } from '@/store/real-gk.store';
import { useUiStore } from '@/store/ui.store';
import { useLoadReplay } from '@/hooks/use-load-replay';
import { MatchAction } from '@/enums/match-action.enum';
import { formatMinute } from '@/lib/format';
import { cn } from '@/lib/utils';

const FALLBACK_TOTAL = 95;
const clampPct = (minute: number, total: number) => Math.max(0, Math.min(100, (minute / total) * 100));

// Marker colour by notable action (other actions don't get a marker).
const MARKER_CLASS: Partial<Record<MatchAction, string>> = {
  [MatchAction.Goal]: 'bg-neon',
  [MatchAction.Penalty]: 'bg-neon',
  [MatchAction.YellowCard]: 'bg-chart-4',
  [MatchAction.RedCard]: 'bg-live',
  [MatchAction.Corner]: 'bg-team-home',
};

/**
 * The single hero playback surface. The match streams from the backend (live SSE or `POST /replay`),
 * so there is no client-side playhead: the bar is a progress readout with markers at the streamed
 * event minutes. Restart re-runs the replay stream from kickoff; speed cycles the stream pace (also
 * a restart — a backend stream cannot seek). Play/pause freezes the pitch; without a replay the
 * restart/speed buttons fall back to the ambient engine.
 *
 * `playback={false}` (private rooms) drops the play/restart/speed cluster — a shared room watches
 * one stream together, so nobody gets to rewind or re-pace it for everyone else.
 */
export function MatchTimeline({ playback = true }: { playback?: boolean }) {
  const match = useDisplayMatch();
  const hasMatch = useMatch() !== null;
  const isReplay = useIsReplay();
  const inPlay = useIsInPlay();
  const ended = useIsEnded();
  const liveMinute = useLiveMinute();
  const events = useMatchEvents();
  const replaySpeed = useReplaySessionStore((state) => state.speed);
  const hasSource = useReplaySessionStore((state) => state.source !== null);
  const { restartReplay, cycleReplaySpeed, forceLive } = useLoadReplay();

  const controls = useHeroControls();
  const engineSpeed = useRealGkStore((state) => state.speed);
  const playing = useUiStore((state) => state.playing);
  const togglePlaying = useUiStore((state) => state.togglePlaying);

  // Backend-driven replay controls only make sense when we know what to re-stream.
  const streaming = isReplay && hasSource;
  const total = FALLBACK_TOTAL;
  const position = Math.min(liveMinute, total);
  const speed = streaming ? replaySpeed : engineSpeed;
  const markers = events.filter((event) => event.minute != null && MARKER_CLASS[event.action]);

  const onSpeed = () => {
    if (streaming) cycleReplaySpeed();
    else controls?.cycleSpeed();
  };
  const onRestart = () => {
    if (streaming) {
      restartReplay();
      return;
    }
    controls?.restart();
    if (!playing) togglePlaying();
  };

  return (
    <GlassPanel tone="dark" radius="xl" className="pointer-events-auto flex items-center gap-3 px-3 py-2">
      {playback && (
        <>
          <IconButton size="icon-sm" label={playing ? 'Pause' : 'Play'} onClick={togglePlaying}>
            {playing ? <Pause /> : <Play />}
          </IconButton>

          <IconButton
            size="icon-sm"
            label={streaming ? 'Replay from kickoff' : 'Restart match'}
            onClick={onRestart}
          >
            <ClockCounterClockwise />
          </IconButton>

          <button
            type="button"
            onClick={onSpeed}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs font-semibold text-muted-foreground transition hover:border-neon hover:text-foreground"
            aria-label={streaming ? 'Cycle stream speed (restarts from kickoff)' : 'Cycle speed'}
          >
            <Lightning className="size-3.5" />
            {speed ? `${speed}×` : '1×'}
          </button>
        </>
      )}

      {/* Manual override: the schedule/feed said "not live" but the match IS on — force live mode.
          Hidden once the match genuinely ended (the winner screen owns that state). */}
      {hasMatch && !inPlay && !ended && (
        <button
          type="button"
          onClick={() => void forceLive()}
          aria-label="Force live mode"
          className="inline-flex items-center gap-1.5 rounded-md border border-live/50 bg-live/10 px-2 py-1 font-mono text-xs font-bold text-live transition hover:bg-live/20"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-live motion-reduce:animate-none" />
          GO LIVE
        </button>
      )}

      {/* Progress readout — the stream drives the playhead; markers at the streamed event minutes. */}
      <div className="relative flex min-w-0 flex-1 items-center">
        <div
          role="progressbar"
          aria-label="Match progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={Math.round(position)}
          className="h-1.5 w-full overflow-hidden rounded-full bg-white/12"
        >
          <div
            className="h-full rounded-full bg-neon transition-[width] duration-500"
            style={{ width: `${clampPct(position, total)}%` }}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
          {markers.map((event, index) => {
            const teamCode = event.participant === 2 ? match.away.code : match.home.code;
            return (
              <span
                key={`${event.seq}-${index}`}
                title={`${formatMinute(event.minute ?? 0)} · ${event.rawAction ?? event.action} (${teamCode})`}
                className={cn(
                  'absolute size-2 -translate-x-1/2 rounded-full ring-2 ring-black/40',
                  MARKER_CLASS[event.action],
                )}
                style={{ left: `${clampPct(event.minute ?? 0, total)}%` }}
              />
            );
          })}
        </div>
      </div>

      <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-muted-foreground">
        {Math.round(position)}&apos;
      </span>

      <span className="mx-0.5 hidden h-5 w-px bg-border sm:block" />

      <div className="hidden sm:block">
        <HeroViewControls />
      </div>
    </GlassPanel>
  );
}
