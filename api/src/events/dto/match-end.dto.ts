import { MatchResultOutcome } from '../enums/match-result-outcome.enum';

/**
 * Emitted on `match-end.after` when a fixture reaches full time (confirmed).
 * The authoritative trigger the keeper uses to settle on-chain markets.
 */
export interface MatchEndPayload {
  fixtureId: number;
  seq: number;
  ts: number;
  homeScore?: number;
  awayScore?: number;
  /** Best-effort 1X2 result; undefined when the score can't be parsed. */
  outcome?: MatchResultOutcome;
}
