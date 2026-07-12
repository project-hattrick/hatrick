import type { MatchAction } from '@/enums/match-action.enum';
import type { EmissionState } from '@/enums/emission-state.enum';
import type { GameState } from '@/enums/game-state.enum';
import type { TeamSide } from '@/enums/team-side.enum';

/**
 * Cumulative per-player counters from the feed. Sparse: a zero counter is
 * omitted, so an absent key means 0 (not "unknown").
 */
export interface PlayerMatchStats {
  goals?: number;
  shots?: number;
  ownGoals?: number;
  penaltyAttempts?: number;
  penaltyGoals?: number;
  yellowCards?: number;
  redCards?: number;
}

/** Wire `PlayerStats` normalized to sides — keys are TxLINE player IDs. */
export interface PlayerStatsBySide {
  home: Record<string, PlayerMatchStats>;
  away: Record<string, PlayerMatchStats>;
}

/** One player slot from the `lineups` action — feed IDs only, never names. */
export interface LineupSlot {
  playerId: number;
  shirt?: number;
  positionId?: number;
  starter?: boolean;
}

/** Full lineups per side, pushed once on the `lineups` action (~40min before kickoff). */
export interface LineupsBySide {
  home: LineupSlot[];
  away: LineupSlot[];
}

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
  /** TxLINE player ID attributed to the action (goal scorer, carded player…). */
  playerId?: number;
  /** `Head | Shot | OwnGoal | Other` when the provider qualifies a goal. */
  goalType?: string;
  /** Shot/penalty/VAR result: `OnTarget|OffTarget|Woodwork|Blocked | Scored|Missed|Retake | Stands|Overturned`. */
  outcome?: string;
  /** VAR review subject: `Goal|Penalty|RedCard|SecondYellowCard|CornerKick|MistakenIdentity|Other`. */
  varType?: string;
  /** Free-kick danger tier: `Safe|Attack|Danger|HighDanger|Offside`. */
  freeKickType?: string;
  participant?: number;
  /** Authoritative cumulative score at this event (from the wire `Score` object). */
  score?: { home?: number; away?: number };
  /** Regulation-time (H1+H2) score — settlement basis; `score` includes extra time. */
  regulationScore?: { home?: number; away?: number };
  /** Per-player cumulative stats keyed by TxLINE player ID. */
  playerStats?: PlayerStatsBySide;
  /** Present only on `lineups` events. */
  lineups?: LineupsBySide;
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
  /** Regulation-time (H1+H2) score — `homeScore/awayScore` include extra time. */
  regulationHomeScore?: number;
  regulationAwayScore?: number;
  outcome?: string;
  /** 1X2 result on regulation time only — the standard betting settlement basis. */
  regulationOutcome?: string;
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
