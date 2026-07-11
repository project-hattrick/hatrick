'use client';

import { useCallback, useState } from 'react';

import { replayService, type ReplayCatalogItem } from '@/services/replay.service';
import { useMatchStore } from '@/store/match.store';
import { useReplaySessionStore } from '@/store/replay-session.store';
import { teamInfoFromName } from '@/config/teams.config';
import { toMatchEvents } from '@/lib/fixture-actions';
import { estimateMinute } from '@/lib/match-clock';
import { GameState } from '@/enums/game-state.enum';
import { TeamSide } from '@/enums/team-side.enum';
import type { LiveMatch } from '@/types/match';

/** How long after kickoff a fixture still counts as in play (90' + break + stoppage headroom). */
const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * Loads a finished fixture as a real-time-feeling replay: switch to it, then stream its history back
 * through the backend during/after pipeline (`POST /replay`). The events arrive on the SAME realtime
 * channels as a live match, so `useLiveFeed` climbs the store (scoreboard/timeline/dashboard) and
 * `useRealgkDriver` mirrors them on the hero pitch. Shared by the picker, the hero auto-replay and
 * the replay controls — a backend stream cannot seek, so restart/speed re-run the same stream.
 */
export function useLoadReplay() {
  const beginReplay = useMatchStore((state) => state.beginReplay);
  const startMatch = useMatchStore((state) => state.startMatch);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  /**
   * Join a fixture that is in play right now: seed an estimated clock, then pull the authoritative
   * snapshot (score + notable actions) so the UI doesn't sit at 0–0 waiting for the next wire event.
   * The live channels drive everything from here.
   */
  const joinLive = useCallback(
    async (base: Omit<LiveMatch, 'gameState' | 'startTime'>, startTime: number) => {
      const now = Date.now();
      const minute = Math.max(base.minute, estimateMinute(now - startTime));
      startMatch({
        ...base,
        minute,
        gameState: minute >= 45 ? GameState.SecondHalf : GameState.FirstHalf,
        startTime,
      });
      try {
        const snap = await replayService.getScore(base.fixtureId);
        const store = useMatchStore.getState();
        if (snap.finished) {
          // The window lied (abandoned/short match) — settle on the final score.
          store.finishMatch({ fixtureId: base.fixtureId, seq: 0, ts: now, homeScore: snap.home, awayScore: snap.away });
        } else if (snap.hasScore) {
          const current = store.match;
          const baseline = Math.max(current?.fixtureId === base.fixtureId ? current.minute : 0, snap.minute ?? minute);
          store.setReplayFrame(
            base.fixtureId,
            { home: snap.home, away: snap.away },
            baseline,
            toMatchEvents(base.fixtureId, snap.actions),
          );
        }
      } catch {
        // Snapshot unavailable — the next live event carries the cumulative score anyway.
      }
    },
    [startMatch],
  );

  /**
   * Manual override ("Go live"): treat the CURRENT match as in play right now, regardless of what
   * the schedule said — re-seeds the clock and re-pulls the snapshot baseline.
   */
  const forceLive = useCallback(async () => {
    const { match } = useMatchStore.getState();
    if (!match) return;
    const source = useReplaySessionStore.getState().source;
    const startTime =
      match.startTime ?? (source?.fixtureId === match.fixtureId ? source.startTime : undefined) ?? Date.now();
    try {
      await replayService.stop();
    } catch {
      // No active replay — nothing to stop.
    }
    await joinLive(
      { fixtureId: match.fixtureId, home: match.home, away: match.away, score: match.score, minute: match.minute },
      Math.min(startTime, Date.now()),
    );
  }, [joinLive]);

  const loadReplay = useCallback(
    async (game: ReplayCatalogItem, speedOverride?: number) => {
      const session = useReplaySessionStore.getState();
      session.setSource(game);
      // Kill any running stream BEFORE resetting the store: its events share our channels (and, on a
      // same-fixture restart, the same fixtureId), so stragglers landing after the reset would stick a
      // stale minute/score (minute is monotonic; resolveScore trusts the highest seq).
      try {
        await replayService.stop();
      } catch {
        // No active replay (or a transient error) — nothing to stop.
      }
      const base = {
        fixtureId: game.fixtureId,
        home: teamInfoFromName(game.home, TeamSide.Home),
        away: teamInfoFromName(game.away, TeamSide.Away),
        score: { home: 0, away: 0 },
        minute: 0,
      };
      // A future fixture isn't a replay: show it as pre-match (kickoff countdown, betting open) and
      // let the live channels take over at kickoff — nothing to stream, so no buffering overlay.
      const now = Date.now();
      if (game.startTime > now) {
        startMatch({ ...base, gameState: GameState.PreMatch, startTime: game.startTime });
        return;
      }
      // Already kicked off but inside the live window: this is a LIVE match, not a replay.
      if (now - game.startTime < LIVE_WINDOW_MS) {
        await joinLive(base, game.startTime);
        return;
      }
      beginReplay({ ...base, gameState: GameState.FullTime });
      setIsLoadingScore(true);
      // Safety net: clear the "switching" overlay even if the stream never delivers a first event.
      window.setTimeout(() => useMatchStore.getState().setSwitching(false), 40_000);
      try {
        // Stream the finished match back through the live pipeline; the backend supersedes any prior replay.
        await replayService.start({
          fixtureId: game.fixtureId,
          epochDay: game.epochDay,
          startHour: game.startHour,
          speed: speedOverride ?? session.speed,
        });
      } catch {
        // Replay couldn't start — drop the overlay so the UI isn't stuck buffering.
        useMatchStore.getState().setSwitching(false);
      } finally {
        setIsLoadingScore(false);
      }
    },
    [beginReplay, startMatch, joinLive],
  );

  /** "Rewind": restart the current fixture's stream from kickoff (backend streams cannot seek). */
  const restartReplay = useCallback(() => {
    const { source } = useReplaySessionStore.getState();
    if (source) void loadReplay(source);
  }, [loadReplay]);

  /** Cycle the stream pace and restart from kickoff at the new speed (pace is a start parameter). */
  const cycleReplaySpeed = useCallback(() => {
    const session = useReplaySessionStore.getState();
    if (session.source) void loadReplay(session.source, session.cycleSpeed());
  }, [loadReplay]);

  return { loadReplay, restartReplay, cycleReplaySpeed, forceLive, isLoadingScore };
}
