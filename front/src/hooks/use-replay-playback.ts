'use client';

import { useEffect } from 'react';

import { useReplayPlaybackStore } from '@/store/replay-playback.store';
import { useMatchStore } from '@/store/match.store';
import { timelineToMatchEvents } from '@/lib/fixture-actions';

// Base playback rate: minutes of match time per real second at speed 1×.
const MIN_PER_SEC = 3;
const TICK_MS = 200;

/**
 * Drives the front-driven replay: ticks the playhead while playing, and on every cursor change pushes
 * the frame (authoritative score + events up to the cursor + minute) into the match store, so the
 * whole hero (scoreboard, timeline, dashboard) plays the match back from kickoff. Seekable via the
 * timeline slider (setCursor). Mounted once in LiveDashboard.
 */
export function useReplayPlayback(): void {
  const timeline = useReplayPlaybackStore((state) => state.timeline);
  const cursor = useReplayPlaybackStore((state) => state.cursor);
  const playing = useReplayPlaybackStore((state) => state.playing);
  const speed = useReplayPlaybackStore((state) => state.speed);
  const setReplayFrame = useMatchStore((state) => state.setReplayFrame);

  // Advance the playhead while playing.
  useEffect(() => {
    if (!playing || !timeline) return;
    const id = window.setInterval(
      () => useReplayPlaybackStore.getState().tick(speed * MIN_PER_SEC * (TICK_MS / 1000)),
      TICK_MS,
    );
    return () => window.clearInterval(id);
  }, [playing, timeline, speed]);

  // Reflect the current playhead into the match store (score climbs, events reveal, minute advances).
  useEffect(() => {
    if (!timeline) return;
    const upTo = timeline.events.filter((event) => event.minute <= cursor);
    const last = upTo[upTo.length - 1];
    const score = last ? { home: last.home, away: last.away } : { home: 0, away: 0 };
    setReplayFrame(timeline.fixtureId, score, Math.round(cursor), timelineToMatchEvents(timeline.fixtureId, upTo));
  }, [timeline, cursor, setReplayFrame]);
}
