/** Minimal subset of TxLINE payloads we consume. Full schema: docs/txline-provider.md. */

/**
 * Cumulative per-player counters (`SoccerPlayerStats`). The wire blob is sparse:
 * a zero counter is omitted, so an absent key means 0 (not "unknown").
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

/** One player slot from the `lineups` action — names are dropped at the source (CODE-N identity). */
export interface LineupSlot {
  playerId: number;
  /** Shirt number parsed from `rosterNumber`, when numeric. */
  shirt?: number;
  positionId?: number;
  starter?: boolean;
}

/** Starting/full lineups per side, extracted from the `action=lineups` event. */
export interface LineupsBySide {
  home: LineupSlot[];
  away: LineupSlot[];
}

export interface RawScoreEvent {
  fixtureId: number;
  gameState?: string;
  action?: string;
  ts: number;
  seq: number;
  /** false → emit `*.during` · true → emit `*.after` */
  confirmed: boolean;
  possession?: number;
  possessionType?: string;
  dataSoccer?: {
    Action?: string;
    Type?: string;
    PlayerId?: number;
    /** Substitution: player coming in / going out. */
    PlayerInId?: number;
    PlayerOutId?: number;
    Participant?: number;
    Minutes?: number;
    Goal?: boolean;
    /** `Head | Shot | OwnGoal | Other` when the provider qualifies the goal. */
    GoalType?: string;
    YellowCard?: boolean;
    RedCard?: boolean;
    Corner?: boolean;
    Penalty?: boolean;
    VAR?: boolean;
    /**
     * Result qualifier when the provider gives one:
     * shot → `OnTarget | OffTarget | Woodwork | Blocked`,
     * penalty → `Scored | Missed | Retake`,
     * VAR → `Stands | Overturned`.
     */
    Outcome?: string;
    /** VAR review subject: `Goal | Penalty | RedCard | SecondYellowCard | CornerKick | MistakenIdentity | Other`. */
    VarType?: string;
    /** Free-kick danger tier: `Safe | Attack | Danger | HighDanger | Offside` (Offside = an offside call, not a set piece). */
    FreeKickType?: string;
    /** Weather / pitch condition strings (SoccerCondition). */
    Conditions?: string[];
  };
  scoreSoccer?: Record<string, unknown>;
  /** Authoritative cumulative goals from the wire `Score` object (when present). */
  homeGoals?: number;
  awayGoals?: number;
  /**
   * Regulation-time (H1+H2) goals — excludes extra time and shootout.
   * Standard 1X2 / Over-Under settlement must use these, not the Total.
   * Undefined until the wire Score carries a period breakdown.
   */
  regulationHomeGoals?: number;
  regulationAwayGoals?: number;
  /** Per-player stats (`PlayerStats`) — feeds Fantasy attribute recalculation. */
  playerStats?: PlayerStatsBySide;
  /** Present only on `action=lineups` events. */
  lineups?: LineupsBySide;
  [key: string]: unknown;
}

export interface RawOddsEvent {
  FixtureId: number;
  MessageId: string;
  Ts: number;
  Bookmaker: string;
  BookmakerId: number;
  SuperOddsType: string;
  InRunning: boolean;
  MarketPeriod?: string;
  /** Market line qualifier, e.g. `line=2.5` on OVERUNDER families (observed live 10/07). */
  MarketParameters?: string;
  PriceNames?: string[];
  Prices?: number[];
  Pct?: string[];
  [key: string]: unknown;
}

export interface RawFixture {
  FixtureId: number;
  StartTime: number;
  Ts: number;
  Competition: string;
  CompetitionId: number;
  FixtureGroupId?: number;
  Participant1Id: number;
  Participant1: string;
  Participant2Id: number;
  Participant2: string;
  Participant1IsHome: boolean;
}

export type StreamKind = 'scores' | 'odds';
