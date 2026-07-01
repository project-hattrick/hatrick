import { MatchAction } from '@/enums/match-action.enum';
import type { MatchEventPayload } from '@/types/match';

export interface TeamStatLine {
  goals: number;
  corners: number;
  yellow: number;
  red: number;
}

export interface MatchStats {
  home: TeamStatLine;
  away: TeamStatLine;
}

const emptyLine = (): TeamStatLine => ({ goals: 0, corners: 0, yellow: 0, red: 0 });

/** Which stat counter each action increments (events with no entry are ignored). */
const actionField: Partial<Record<MatchAction, keyof TeamStatLine>> = {
  [MatchAction.Goal]: 'goals',
  [MatchAction.Corner]: 'corners',
  [MatchAction.YellowCard]: 'yellow',
  [MatchAction.RedCard]: 'red',
};

/** Tallies per-team match stats from the event stream (participant 1 = home, 2 = away). */
export function deriveMatchStats(events: MatchEventPayload[]): MatchStats {
  const stats: MatchStats = { home: emptyLine(), away: emptyLine() };
  for (const event of events) {
    const field = actionField[event.action];
    if (!field || (event.participant !== 1 && event.participant !== 2)) continue;
    const team = event.participant === 1 ? stats.home : stats.away;
    team[field] += 1;
  }
  return stats;
}
