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
  /**
   * Regulation-time (H1+H2) score. `homeScore/awayScore` include extra time,
   * so standard 1X2 / Over-Under markets settle on these when present.
   */
  regulationHomeScore?: number;
  regulationAwayScore?: number;
  /** Best-effort 1X2 result; undefined when the score can't be parsed. */
  outcome?: MatchResultOutcome;
  /** 1X2 result on regulation time only — the standard betting settlement basis. */
  regulationOutcome?: MatchResultOutcome;
}
