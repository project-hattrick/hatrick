'use client';

import { useEffect, type MutableRefObject } from 'react';

import { getSocket } from './socket';
import { EmissionState } from '@/enums/emission-state.enum';
import type { MatchEventPayload } from '@/types/match';
import type { HeadsOnlyHandle } from '@/game/headsonly/engine';
import { Team } from '@/game/headsonly/types';

const THREAT: Record<string, number> = { Safe: 0.15, Attack: 0.5, Danger: 0.75, HighDanger: 0.95 };

/** How threatening this event makes the team's possession (null = don't nudge). */
function threatOf(possessionType?: string, raw?: string): number | null {
  if (possessionType && possessionType in THREAT) return THREAT[possessionType];
  if (raw && /free_kick|throw_in|goal_kick|kickoff/.test(raw)) return 0.2;
  return null;
}

/** Map one live event onto engine director calls (the "molding"). */
function drive(h: HeadsOnlyHandle, p: MatchEventPayload): void {
  if (p.score) h.setScore(p.score.home ?? 0, p.score.away ?? 0);
  const team = p.participant === 1 ? Team.Blue : p.participant === 2 ? Team.Red : null;
  if (!team) return;
  const raw = (p.rawAction ?? '').toLowerCase();
  // Discrete actions — gated to one emission state so during+after don't double-fire.
  if (raw === 'goal') return void (p.state === EmissionState.After && h.injectGoal(team));
  if (raw === 'shot') return void (p.state === EmissionState.During && h.injectShot(team));
  if (raw === 'corner') return void (p.state === EmissionState.During && h.injectCorner(team));
  if (raw.includes('card')) return void (p.state === EmissionState.After && h.injectCard(team));
  // Continuous flow — steer possession + threat.
  const t = threatOf(p.possessionType, raw);
  if (t != null) h.setPossession(team, t);
}

/**
 * Subscribes to the realtime feed and drives the heads engine imperatively
 * (kept out of React render — the engine runs its own RAF loop).
 */
export function useHeadsDriver(handleRef: MutableRefObject<HeadsOnlyHandle | null>, fixtureId: number | null): void {
  useEffect(() => {
    const socket = getSocket();
    const onMatch = (p: MatchEventPayload) => {
      if (fixtureId == null || p.fixtureId !== fixtureId) return;
      const h = handleRef.current;
      if (h) drive(h, p);
    };
    socket.on(`match-event.${EmissionState.During}`, onMatch);
    socket.on(`match-event.${EmissionState.After}`, onMatch);
    return () => {
      socket.off(`match-event.${EmissionState.During}`, onMatch);
      socket.off(`match-event.${EmissionState.After}`, onMatch);
    };
  }, [handleRef, fixtureId]);
}
