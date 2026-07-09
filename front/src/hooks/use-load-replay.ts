'use client';

import { useCallback, useState } from 'react';

import { replayService, type ReplayCatalogItem } from '@/services/replay.service';
import { useMatchStore } from '@/store/match.store';
import { useReplayPlaybackStore } from '@/store/replay-playback.store';
import { teamInfoFromName } from '@/config/teams.config';
import { GameState } from '@/enums/game-state.enum';
import { TeamSide } from '@/enums/team-side.enum';

/**
 * Ambient replay pace for the landing. True 1:1 (speed 1) leaves the scoreline/minute visibly frozen for
 * ~60s at a time — reads as a delay/bug on a marketing hero — so picked past matches stream a bit faster
 * while still faithfully reflecting the real match. LIVE matches are untouched: they arrive over the real
 * SSE feed in genuine real time.
 */
const REPLAY_SPEED = 6;

/**
 * Loads a finished fixture as a real-time-feeling replay: switch to it, then stream its history back
 * through the backend during/after pipeline (`POST /replay`). The events arrive on the SAME realtime
 * channels as a live match, so `useLiveFeed` climbs the store (scoreboard/timeline/dashboard) and
 * `useRealgkDriver` mirrors them on the hero pitch. Shared by the picker and the hero auto-replay.
 */
export function useLoadReplay() {
  const beginReplay = useMatchStore((state) => state.beginReplay);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  const loadReplay = useCallback(
    async (game: ReplayCatalogItem) => {
      useReplayPlaybackStore.getState().clear(); // drop any legacy front-driven playback state
      beginReplay({
        fixtureId: game.fixtureId,
        home: teamInfoFromName(game.home, TeamSide.Home),
        away: teamInfoFromName(game.away, TeamSide.Away),
        score: { home: 0, away: 0 },
        minute: 0,
        gameState: GameState.FullTime,
      });
      setIsLoadingScore(true);
      try {
        // Stream the finished match back through the live pipeline; the backend supersedes any prior replay.
        await replayService.start({
          fixtureId: game.fixtureId,
          epochDay: game.epochDay,
          startHour: game.startHour,
          speed: REPLAY_SPEED,
        });
      } catch {
        /* replay couldn't start — the backdrop stays in attract mode, overlays at 0-0 */
      } finally {
        setIsLoadingScore(false);
      }
    },
    [beginReplay],
  );

  return { loadReplay, isLoadingScore };
}
