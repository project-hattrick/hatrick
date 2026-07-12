import {
  LineupSlot,
  LineupsBySide,
  PlayerMatchStats,
  PlayerStatsBySide,
  RawOddsEvent,
  RawScoreEvent,
} from '../txline.types';

/**
 * Adapts the real TxLINE wire schema to the internal Raw*Event shapes the
 * normalizer consumes. The provider changes shapes often, so this layer is
 * deliberately defensive: it tolerates both key casings, missing/renamed
 * nested objects, and unexpected types; it never throws; and it returns `null`
 * for events too broken to route (no fixtureId/ts) so callers can skip them.
 *
 * Observed reality (≠ the docs' lowercase schema):
 *   score: `FixtureId, Action, Ts, Seq, Confirmed, Participant, Clock:{Seconds},
 *           Score:{ParticipantN:{H1,HT,H2,ET1,ET2,PE,Total}:{Goals,YellowCards,RedCards,Corners}},
 *           Stats:{}, PlayerStats:{ParticipantN:{playerId:{goals,shots,…}}}` —
 *           Action string is authoritative; `game_finalised` is full-time
 *           (GameState stays "scheduled"). `Total` includes extra time, so the
 *           mapper also derives regulation (H1+H2) goals for standard settlement.
 *   odds:  already Capitalized, matches RawOddsEvent.
 */

/** Loose view of a wire score event — every field optional, both casings. */
export interface WireScoreEvent {
  FixtureId?: unknown; fixtureId?: unknown;
  GameState?: unknown; gameState?: unknown;
  Action?: unknown; action?: unknown;
  Ts?: unknown; ts?: unknown;
  Seq?: unknown; seq?: unknown;
  Confirmed?: unknown; confirmed?: unknown;
  Participant?: unknown;
  Participant1Id?: unknown; participant1Id?: unknown;
  Participant2Id?: unknown; participant2Id?: unknown;
  Clock?: { Running?: unknown; Seconds?: unknown } | null;
  Score?: unknown; scoreSoccer?: unknown; ScoreSoccer?: unknown;
  Data?: unknown; data?: unknown; DataSoccer?: unknown; dataSoccer?: unknown;
  PlayerStats?: unknown; playerStatsSoccer?: unknown;
  Lineups?: unknown; lineups?: unknown;
  Stats?: unknown;
  [key: string]: unknown;
}

export interface WireOddsEvent {
  FixtureId?: unknown; fixtureId?: unknown;
  MessageId?: unknown;
  Ts?: unknown; ts?: unknown;
  Bookmaker?: unknown; BookmakerId?: unknown;
  SuperOddsType?: unknown;
  InRunning?: unknown;
  MarketPeriod?: unknown; MarketParameters?: unknown;
  PriceNames?: unknown; Prices?: unknown; Pct?: unknown;
  [key: string]: unknown;
}

// ---- safe coercion primitives (never throw) ----
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const numOr = (fallback: number, ...v: unknown[]): number => {
  for (const x of v) {
    if (typeof x === 'number' && Number.isFinite(x)) return x;
    if (typeof x === 'string' && x.trim() !== '' && Number.isFinite(Number(x))) return Number(x);
  }
  return fallback;
};
const strOr = (fallback: string, ...v: unknown[]): string => {
  for (const x of v) if (typeof x === 'string' && x.length) return x;
  return fallback;
};
const boolOf = (...v: unknown[]): boolean => v.some((x) => x === true || x === 'true');
const arrOf = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
/** Safely walk a nested path, returning a finite number or undefined. */
function deepNum(obj: unknown, ...path: string[]): number | undefined {
  let cur: unknown = obj;
  for (const k of path) {
    if (!isObj(cur)) return undefined;
    cur = cur[k];
  }
  return typeof cur === 'number' && Number.isFinite(cur) ? cur : undefined;
}

/** `safe_possession` → `Safe`, `high_danger_possession` → `HighDanger`, etc. */
function possessionType(action: string): string | undefined {
  if (action.includes('high_danger')) return 'HighDanger';
  if (action.includes('danger')) return 'Danger';
  if (action.includes('attack')) return 'Attack';
  if (action.includes('possession')) return 'Safe';
  return undefined;
}

/** Cumulative Total.Goals for a participant, tolerating flat-number fallbacks. */
export function goalsFromScore(score: unknown, participantKey: string): number | undefined {
  if (!isObj(score)) return undefined;
  const p = score[participantKey];
  if (typeof p === 'number') return Number.isFinite(p) ? p : undefined; // synthetic flat shape
  return deepNum(p, 'Total', 'Goals') ?? deepNum(p, 'total', 'Goals');
}

/**
 * Regulation-time goals (H1+H2) for a participant. `Total` includes extra-time
 * goals, so standard 1X2 / Over-Under settlement needs this instead. Undefined
 * when the wire carries no period breakdown (then Total is the only truth).
 * The Score blob is sparse — a period at 0 goals may omit `Goals`, so a present
 * period object with no `Goals` key counts as 0.
 */
export function regulationGoalsFromScore(score: unknown, participantKey: string): number | undefined {
  if (!isObj(score)) return undefined;
  const p = score[participantKey];
  if (!isObj(p)) return undefined;
  const h1 = isObj(p.H1) ? (deepNum(p, 'H1', 'Goals') ?? 0) : undefined;
  const h2 = isObj(p.H2) ? (deepNum(p, 'H2', 'Goals') ?? 0) : undefined;
  if (h1 === undefined && h2 === undefined) return undefined;
  return (h1 ?? 0) + (h2 ?? 0);
}

/** Known sparse counters of the wire `SoccerPlayerStats` blob. */
const PLAYER_COUNTERS: (keyof PlayerMatchStats)[] = [
  'goals', 'shots', 'ownGoals', 'penaltyAttempts', 'penaltyGoals', 'yellowCards', 'redCards',
];

/** One side of the PlayerStats blob → clean `{playerId: counters}` map. */
function playerStatsSide(side: unknown): Record<string, PlayerMatchStats> {
  const out: Record<string, PlayerMatchStats> = {};
  if (!isObj(side)) return out;
  for (const [playerId, stats] of Object.entries(side)) {
    if (!isObj(stats)) continue;
    const clean: PlayerMatchStats = {};
    for (const key of PLAYER_COUNTERS) {
      const v = numOr(-1, stats[key]);
      if (v >= 0) clean[key] = v;
    }
    if (Object.keys(clean).length) out[playerId] = clean;
  }
  return out;
}

/** Wire `PlayerStats:{Participant1:{id:{…}},Participant2:{…}}` → home/away maps, or undefined when empty. */
export function mapPlayerStats(blob: unknown): PlayerStatsBySide | undefined {
  if (!isObj(blob)) return undefined;
  const home = playerStatsSide(blob.Participant1 ?? blob.participant1);
  const away = playerStatsSide(blob.Participant2 ?? blob.participant2);
  if (!Object.keys(home).length && !Object.keys(away).length) return undefined;
  return { home, away };
}

/** One team's slot list from a `lineups` action — drops names on purpose (CODE-N identity). */
function lineupSlots(team: unknown): LineupSlot[] {
  if (!isObj(team)) return [];
  const players = arrOf<Record<string, unknown>>(team.lineups ?? team.Lineups);
  const out: LineupSlot[] = [];
  for (const slot of players) {
    if (!isObj(slot)) continue;
    const player = isObj(slot.player) ? slot.player : isObj(slot.Player) ? slot.Player : undefined;
    // PlayerStats keys use the player's normative ID — prefer it as the identity.
    const playerId = numOr(0, player?.normativeId, player?.NormativeId, player?.id, slot.fixturePlayerId);
    if (!playerId) continue;
    const shirt = numOr(0, slot.rosterNumber, slot.RosterNumber);
    const positionId = numOr(-1, slot.positionId, slot.PositionId);
    const starter = slot.starter ?? slot.Starter;
    out.push({
      playerId,
      shirt: shirt > 0 ? shirt : undefined,
      positionId: positionId >= 0 ? positionId : undefined,
      starter: typeof starter === 'boolean' ? starter : undefined,
    });
  }
  return out;
}

/**
 * Wire `lineups` (one LineupData per team) → home/away slots. Sides resolve by
 * matching the team's normative ID against Participant1Id/Participant2Id when
 * the event carries them; otherwise array order is [participant1, participant2].
 */
export function mapLineups(w: WireScoreEvent): LineupsBySide | undefined {
  const teams = arrOf<Record<string, unknown>>(w.Lineups ?? w.lineups);
  if (!teams.length) return undefined;
  const p2 = numOr(0, w.Participant2Id, w.participant2Id);
  const teamId = (t: unknown): number => (isObj(t) ? numOr(0, t.normativeId, t.NormativeId, t.id, t.Id) : 0);
  const ordered = p2 && teams.length === 2 && teamId(teams[0]) === p2 ? [teams[1], teams[0]] : teams;
  const home = lineupSlots(ordered[0]);
  const away = lineupSlots(ordered[1]);
  if (!home.length && !away.length) return undefined;
  return { home, away };
}

/** Real wire data blob (`Data`/`DataSoccer`, casing varies) — richer than the action string. */
function dataBlob(w: WireScoreEvent): Record<string, unknown> | undefined {
  const blob = w.DataSoccer ?? w.dataSoccer ?? w.Data ?? w.data;
  return isObj(blob) ? blob : undefined;
}

/** Map a wire score event → internal RawScoreEvent, or null if unroutable. */
export function mapWireScore(w: WireScoreEvent): RawScoreEvent | null {
  if (!isObj(w)) return null;
  const fixtureId = numOr(0, w.FixtureId, w.fixtureId);
  const ts = numOr(0, w.Ts, w.ts);
  if (!fixtureId || !ts) return null; // can't route without identity/order

  const action = strOr('', w.Action, w.action).toLowerCase();
  const seconds = isObj(w.Clock) ? w.Clock.Seconds : undefined;
  const minutes = typeof seconds === 'number' && Number.isFinite(seconds) ? Math.floor(seconds / 60) : undefined;
  // GameState can stay "scheduled" all match; the real full-time signal is the action.
  const rawGameState = strOr('', w.GameState, w.gameState) || undefined;
  const gameState = action === 'game_finalised' ? 'FullTime' : rawGameState;

  // Authoritative cumulative score object (real key is `Score`; tolerate aliases).
  const scoreSoccer = (w.Score ?? w.scoreSoccer ?? w.ScoreSoccer) as Record<string, unknown> | undefined;
  // The Score blob is sparse: a participant with 0 goals omits the `Goals` key.
  // So when a Score object exists, an absent count means 0 (not "unknown").
  const hasScore = isObj(scoreSoccer);

  // Real data blob when present — player attribution, goal type, subs, weather.
  const data = dataBlob(w);
  const participant = numOr(0, data?.Participant, w.Participant) || undefined;
  const playerId = numOr(0, data?.PlayerId, data?.playerId) || undefined;
  const playerInId = numOr(0, data?.PlayerInId) || undefined;
  const playerOutId = numOr(0, data?.PlayerOutId) || undefined;
  const goalType = typeof data?.GoalType === 'string' ? data.GoalType : undefined;
  // Result qualifiers (shot/penalty/VAR outcome, VAR subject, free-kick danger) — richer live beats.
  const outcome = typeof data?.Outcome === 'string' ? data.Outcome : undefined;
  const varType = action.includes('var') && typeof data?.Type === 'string' ? data.Type : undefined;
  const freeKickType = typeof data?.FreeKickType === 'string' ? data.FreeKickType : undefined;
  const conditions = arrOf<string>(data?.Conditions).filter((c) => typeof c === 'string');

  return {
    fixtureId,
    gameState,
    action,
    ts,
    seq: numOr(0, w.Seq, w.seq),
    confirmed: boolOf(w.Confirmed, w.confirmed),
    possessionType: possessionType(action),
    scoreSoccer: hasScore ? scoreSoccer : undefined,
    homeGoals: hasScore ? (goalsFromScore(scoreSoccer, 'Participant1') ?? 0) : undefined,
    awayGoals: hasScore ? (goalsFromScore(scoreSoccer, 'Participant2') ?? 0) : undefined,
    regulationHomeGoals: regulationGoalsFromScore(scoreSoccer, 'Participant1'),
    regulationAwayGoals: regulationGoalsFromScore(scoreSoccer, 'Participant2'),
    playerStats: mapPlayerStats(w.PlayerStats ?? w.playerStatsSoccer),
    lineups: action === 'lineups' ? mapLineups(w) : undefined,
    dataSoccer: {
      Action: action,
      Minutes: numOr(-1, data?.Minutes) >= 0 ? numOr(0, data?.Minutes) : minutes,
      Participant: participant,
      PlayerId: playerId,
      PlayerInId: playerInId,
      PlayerOutId: playerOutId,
      Goal: boolOf(data?.Goal) || action === 'goal',
      GoalType: goalType,
      YellowCard: boolOf(data?.YellowCard) || action === 'yellow_card',
      RedCard: boolOf(data?.RedCard) || action === 'red_card',
      Corner: boolOf(data?.Corner) || action === 'corner',
      Penalty: boolOf(data?.Penalty) || action.includes('penalty'),
      VAR: boolOf(data?.VAR) || action.includes('var'),
      Outcome: outcome,
      VarType: varType,
      FreeKickType: freeKickType,
      Conditions: conditions.length ? conditions : undefined,
    },
  };
}

/** Map a wire odds event → internal RawOddsEvent, or null if unroutable. */
export function mapWireOdds(w: WireOddsEvent): RawOddsEvent | null {
  if (!isObj(w)) return null;
  const FixtureId = numOr(0, w.FixtureId, w.fixtureId);
  const Ts = numOr(0, w.Ts, w.ts);
  if (!FixtureId || !Ts) return null;
  return {
    FixtureId,
    MessageId: strOr('', w.MessageId),
    Ts,
    Bookmaker: strOr('', w.Bookmaker),
    BookmakerId: numOr(0, w.BookmakerId),
    SuperOddsType: strOr('', w.SuperOddsType),
    InRunning: boolOf(w.InRunning),
    MarketPeriod: typeof w.MarketPeriod === 'string' ? w.MarketPeriod : undefined,
    MarketParameters: typeof w.MarketParameters === 'string' ? w.MarketParameters : undefined,
    PriceNames: arrOf<string>(w.PriceNames),
    // Raw integer prices (decimal odds × 1000). Kept raw on purpose — dividing
    // here would silently break if the provider changes the scale factor.
    Prices: arrOf<number>(w.Prices),
    Pct: arrOf<string>(w.Pct),
  };
}
