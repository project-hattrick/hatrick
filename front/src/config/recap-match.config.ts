import { GameState } from '@/enums/game-state.enum';
import { TeamSide } from '@/enums/team-side.enum';
import { MatchAction } from '@/enums/match-action.enum';
import { EmissionState } from '@/enums/emission-state.enum';
import type { LiveMatch, MatchEventPayload } from '@/types/match';

/** Fixture id for the recap fallback — distinct from the live mock so nothing collides. */
export const RECAP_FIXTURE_ID = 2018;

/**
 * The most recent finished match. Shown whenever no game is live (dormant feed / between
 * fixtures) so the home never renders an empty seam — the scorebar and hero fall back to this
 * as a full-time recap instead of disappearing.
 */
export const recapMatch: LiveMatch = {
  fixtureId: RECAP_FIXTURE_ID,
  home: { side: TeamSide.Home, code: 'ARG', name: 'Argentina', flag: '🇦🇷' },
  away: { side: TeamSide.Away, code: 'FRA', name: 'France', flag: '🇫🇷' },
  score: { home: 3, away: 1 },
  minute: 90,
  gameState: GameState.FullTime,
};

function recapGoal(seq: number, minute: number, participant: number, label: string): MatchEventPayload {
  return {
    fixtureId: RECAP_FIXTURE_ID,
    action: MatchAction.Goal,
    state: EmissionState.After,
    confirmed: true,
    seq,
    ts: 0,
    minute,
    participant,
    label,
  };
}

/** Goals of the finished match — drive the recap event chips on the hero scoreboard. */
export const recapEvents: MatchEventPayload[] = [
  recapGoal(1, 23, 1, 'ARG-10'),
  recapGoal(2, 54, 2, 'FRA-10'),
  recapGoal(3, 67, 1, 'ARG-10'),
  recapGoal(4, 85, 1, 'ARG-9'),
];
