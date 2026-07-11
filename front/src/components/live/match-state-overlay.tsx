'use client';

import { useEffect } from 'react';

import { Flag } from '@/components/common/flag';
import { GlassPanel } from '@/components/common/glass-panel';
import { Clock, Pause, Trophy } from '@/components/common/icons';
import { GameState } from '@/enums/game-state.enum';
import { fifaToIso } from '@/lib/country';
import { useDisplayMatch, useIsEnded, useMatchStore } from '@/store/match.store';
import { useUiStore } from '@/store/ui.store';

/**
 * Stage overlay for the live match's structural states (real matches only — replays keep rolling):
 * - Pre-match: soft "waiting for kickoff" banner with the countdown (the pitch keeps its ambient show).
 * - Half-time: the pitch freezes and a banner says the match is paused; the second-half kickoff clears it.
 * - Full-time: the pitch freezes for good and the screen locks on the winner + final score.
 * Mounted once inside MatchBackground so the home hero and both room layouts all get it.
 */
export function MatchStateOverlay() {
  const match = useDisplayMatch();
  const paused = useMatchStore(
    (state) => state.match !== null && !state.isReplay && state.match.gameState === GameState.HalfTime,
  );
  const upcoming = useMatchStore(
    (state) => state.match !== null && !state.isReplay && state.match.gameState === GameState.PreMatch,
  );
  const ended = useIsEnded();
  const frozen = paused || ended;

  // Freeze the ambient pitch while the overlay is up; resume when it clears (or the match switches).
  useEffect(() => {
    if (!frozen) return;
    const ui = useUiStore.getState();
    if (ui.playing) ui.togglePlaying();
    return () => {
      const current = useUiStore.getState();
      if (!current.playing) current.togglePlaying();
    };
  }, [frozen]);

  const { home, away, score } = match;
  const winner = score.home > score.away ? home : score.away > score.home ? away : null;

  // Pre-match: gentle banner, no scrim/freeze — the ambient show keeps the stage alive behind it.
  if (upcoming && !frozen) {
    return (
      <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center px-4">
        <GlassPanel tone="dark" radius="xl" className="flex flex-col items-center gap-1.5 px-8 py-5 text-center">
          <span className="inline-flex items-center gap-2 font-mono text-eyebrow font-bold tracking-[0.2em] text-neon uppercase">
            <Clock className="size-4" weight="duotone" />
            Waiting for kickoff
          </span>
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Flag code={fifaToIso(home.code)} className="text-xl" />
            {home.name} <span className="text-muted-foreground">vs</span> {away.name}
            <Flag code={fifaToIso(away.code)} className="text-xl" />
          </span>
          <span className="text-xs text-muted-foreground">Pre-match odds are open — the feed takes over at kickoff.</span>
        </GlassPanel>
      </div>
    );
  }

  if (!frozen) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/50 backdrop-blur-[2px]">
      <GlassPanel tone="dark" radius="xl" className="flex flex-col items-center gap-2.5 px-10 py-7 text-center">
        {ended ? (
          <>
            <span className="inline-flex items-center gap-2 font-mono text-eyebrow font-bold tracking-[0.2em] text-neon uppercase">
              <Trophy className="size-4" weight="duotone" />
              Full-time
            </span>
            <span className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              {winner ? (
                <>
                  <Flag code={fifaToIso(winner.code)} className="text-3xl" />
                  {winner.name} wins
                </>
              ) : (
                'Draw'
              )}
            </span>
            <span className="font-mono text-4xl font-bold tabular-nums text-neon">
              {score.home}–{score.away}
            </span>
            <span className="text-xs text-muted-foreground">
              {home.name} vs {away.name} · match ended — bets are being settled
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-2 font-mono text-eyebrow font-bold tracking-[0.2em] text-chart-4 uppercase">
              <Pause className="size-4" weight="duotone" />
              Match paused
            </span>
            <span className="text-2xl font-bold tracking-tight">Half-time</span>
            <span className="font-mono text-3xl font-bold tabular-nums text-neon">
              {score.home}–{score.away}
            </span>
            <span className="text-xs text-muted-foreground">
              {home.name} vs {away.name} · play resumes at the second-half kickoff
            </span>
          </>
        )}
      </GlassPanel>
    </div>
  );
}
