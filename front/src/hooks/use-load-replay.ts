'use client';

import { useCallback, useState } from 'react';

import { replayService, type ReplayCatalogItem } from '@/services/replay.service';
import { useMatchStore } from '@/store/match.store';
import { useReplaySessionStore } from '@/store/replay-session.store';
import { teamInfoFromName } from '@/config/teams.config';
import { GameState } from '@/enums/game-state.enum';
import { TeamSide } from '@/enums/team-side.enum';

/**
 * Loads a finished fixture as a real-time-feeling replay: switch to it, then stream its history back
 * through the backend during/after pipeline (`POST /replay`). The events arrive on the SAME realtime
 * channels as a live match, so `useLiveFeed` climbs the store (scoreboard/timeline/dashboard) and
 * `useRealgkDriver` mirrors them on the hero pitch. Shared by the picker, the hero auto-replay and
 * the replay controls — a backend stream cannot seek, so restart/speed re-run the same stream.
 */
export function useLoadReplay() {
  const beginReplay = useMatchStore((state) => state.beginReplay);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

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
      beginReplay({
        fixtureId: game.fixtureId,
        home: teamInfoFromName(game.home, TeamSide.Home),
        away: teamInfoFromName(game.away, TeamSide.Away),
        score: { home: 0, away: 0 },
        minute: 0,
        gameState: GameState.FullTime,
      });
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
    [beginReplay],
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

  return { loadReplay, restartReplay, cycleReplaySpeed, isLoadingScore };
}
