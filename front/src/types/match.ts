import type { MatchAction } from '@/enums/match-action.enum';
import type { EmissionState } from '@/enums/emission-state.enum';
import type { GameState } from '@/enums/game-state.enum';
import type { TeamSide } from '@/enums/team-side.enum';

/** Wire shape pushed on match-event.during / match-event.after (mirrors the api DTO). */
export interface MatchEventPayload {
  fixtureId: number;
  action: MatchAction;
  /** Raw provider action string (e.g. `shot`, `danger_possession`) — richer than the enum. */
  rawAction?: string;
  /** `Safe | Attack | Danger | HighDanger` — drives the 2D danger meter. */
  possessionType?: string;
  state: EmissionState;
  confirmed: boolean;
  seq: number;
  ts: number;
  minute?: number;
  participant?: number;
  /** Authoritative cumulative score at this event (from the wire `Score` object). */
  score?: { home?: number; away?: number };
  playerStats?: Record<string, unknown>;
  label?: string;
}

/** Pushed on `odds.update`. */
export interface OddsEventPayload {
  fixtureId: number;
  bookmaker: string;
  superOddsType: string;
  inRunning: boolean;
  /** H1 / HT / H2 / Total (absent = full match). */
  marketPeriod?: string;
  /** Line qualifier, e.g. `line=2.5` on OVERUNDER families. */
  marketParameters?: string;
  priceNames: string[];
  prices: number[];
  ts: number;
}

/** Pushed on `match-end.after`. */
export interface MatchEndPayload {
  fixtureId: number;
  seq: number;
  ts: number;
  homeScore?: number;
  awayScore?: number;
  outcome?: string;
}

export interface TeamInfo {
  side: TeamSide;
  code: string;
  name: string;
  flag: string;
}

export interface MatchScore {
  home: number;
  away: number;
}

export interface LiveMatch {
  fixtureId: number;
  home: TeamInfo;
  away: TeamInfo;
  score: MatchScore;
  minute: number;
  gameState: GameState;
  /** Kickoff time (epoch ms) — present when known; drives the pre-match countdown. */
  startTime?: number;
}
