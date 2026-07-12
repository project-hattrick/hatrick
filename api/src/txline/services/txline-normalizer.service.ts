import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EmissionState } from '../../events/enums/emission-state.enum';
import { EventName } from '../../events/enums/event-name.enum';
import { MatchAction } from '../../events/enums/match-action.enum';
import { MatchResultOutcome } from '../../events/enums/match-result-outcome.enum';
import { MatchEndPayload, MatchEventPayload, OddsEventPayload } from '../../events/dto';
import { RawOddsEvent, RawScoreEvent } from '../txline.types';
import { goalsFromScore, regulationGoalsFromScore } from './txline-mapper';
import { TournamentStateService } from './tournament-state.service';

/** Wire actions we knowingly handle — anything else is logged once (drift watch). */
const KNOWN_ACTIONS = new Set([
  'goal', 'yellow_card', 'red_card', 'corner', 'substitution', 'free_kick', 'penalty',
  'shot', 'kickoff', 'goal_kick', 'throw_in', 'injury', 'halftime_finalised', 'game_finalised',
  'safe_possession', 'attack_possession', 'danger_possession', 'high_danger_possession', 'possession',
  'clock_adjustment', 'status', 'additional_time', 'possible', 'comment', 'standby', 'disconnected',
  'action_amend', 'action_discarded', 'var', 'lineups', '',
]);

/**
 * Maps raw TxLINE payloads to domain events and emits them in two states
 * (during/after) per the `confirmed` flag. Core of docs/architecture.md.
 */
@Injectable()
export class TxlineNormalizerService {
  private readonly logger = new Logger(TxlineNormalizerService.name);
  /** Fixtures already ended — guards against duplicate `match-end.after` emits. */
  private readonly ended = new Set<number>();
  /** Actions we've already flagged as unrecognized — log each once, not per event. */
  private readonly unknownActions = new Set<string>();

  constructor(
    private readonly emitter: EventEmitter2,
    private readonly state: TournamentStateService,
  ) {}

  handleScore(raw: RawScoreEvent): void {
    this.state.applyScore(raw);
    this.watchDrift(raw.action);
    const action = this.resolveAction(raw);
    const emission = raw.confirmed ? EmissionState.After : EmissionState.During;
    const [home, away] = this.parseScore(raw);

    const [regHome, regAway] = this.parseRegulationScore(raw);

    const payload: MatchEventPayload = {
      fixtureId: raw.fixtureId,
      action,
      rawAction: raw.action,
      possessionType: raw.possessionType,
      state: emission,
      confirmed: raw.confirmed,
      seq: raw.seq,
      ts: raw.ts,
      minute: raw.dataSoccer?.Minutes,
      playerId: raw.dataSoccer?.PlayerId,
      goalType: raw.dataSoccer?.GoalType,
      outcome: raw.dataSoccer?.Outcome,
      varType: raw.dataSoccer?.VarType,
      freeKickType: raw.dataSoccer?.FreeKickType,
      participant: raw.dataSoccer?.Participant,
      score: home !== undefined || away !== undefined ? { home, away } : undefined,
      regulationScore: regHome !== undefined || regAway !== undefined ? { home: regHome, away: regAway } : undefined,
      playerStats: raw.playerStats,
      lineups: raw.lineups,
    };

    // Always emit the generic score-update (the gateway forwards these); also emit
    // the action-specific event when it differs, so specialized listeners can target
    // goal.*/corner.* without the generic listeners seeing the same frame twice.
    const generic = emission === EmissionState.After ? EventName.ScoreUpdateAfter : EventName.ScoreUpdateDuring;
    const specific = this.actionEvent(action, emission);
    this.emitter.emit(generic, payload);
    if (specific !== generic) this.emitter.emit(specific, payload);

    this.maybeEmitMatchEnd(raw);
  }

  /** Emit `match-end.after` once per fixture when a confirmed full-time arrives. */
  private maybeEmitMatchEnd(raw: RawScoreEvent): void {
    if (!raw.confirmed || !this.isFullTime(raw.gameState) || this.ended.has(raw.fixtureId)) return;
    this.ended.add(raw.fixtureId);

    const [homeScore, awayScore] = this.parseScore(raw);
    const [regulationHomeScore, regulationAwayScore] = this.parseRegulationScore(raw);
    const payload: MatchEndPayload = {
      fixtureId: raw.fixtureId,
      seq: raw.seq,
      ts: raw.ts,
      homeScore,
      awayScore,
      regulationHomeScore,
      regulationAwayScore,
      outcome: this.resolveOutcome(homeScore, awayScore),
      regulationOutcome: this.resolveOutcome(regulationHomeScore, regulationAwayScore),
    };
    this.emitter.emit(EventName.MatchEndAfter, payload);
  }

  private isFullTime(gameState?: string): boolean {
    return !!gameState && /full[\s-]?time|finished|ended|\bft\b/i.test(gameState);
  }

  /** Authoritative home/away goals: mapper-derived first, then the `Score` blob. */
  private parseScore(raw: RawScoreEvent): [number?, number?] {
    const home = raw.homeGoals ?? goalsFromScore(raw.scoreSoccer, 'Participant1');
    const away = raw.awayGoals ?? goalsFromScore(raw.scoreSoccer, 'Participant2');
    return [home, away];
  }

  /** Regulation-time (H1+H2) goals — undefined when the wire has no period breakdown. */
  private parseRegulationScore(raw: RawScoreEvent): [number?, number?] {
    const home = raw.regulationHomeGoals ?? regulationGoalsFromScore(raw.scoreSoccer, 'Participant1');
    const away = raw.regulationAwayGoals ?? regulationGoalsFromScore(raw.scoreSoccer, 'Participant2');
    return [home, away];
  }

  /** Note unrecognized wire actions once, so provider schema drift is visible. */
  private watchDrift(action?: string): void {
    const a = action ?? '';
    if (KNOWN_ACTIONS.has(a) || this.unknownActions.has(a)) return;
    this.unknownActions.add(a);
    this.logger.warn(`unrecognized TxLINE action "${a}" — routed as ScoreUpdate; check for schema drift.`);
  }

  private resolveOutcome(home?: number, away?: number): MatchResultOutcome | undefined {
    if (home === undefined || away === undefined) return undefined;
    if (home > away) return MatchResultOutcome.Home;
    if (home < away) return MatchResultOutcome.Away;
    return MatchResultOutcome.Draw;
  }

  handleOdds(raw: RawOddsEvent): void {
    this.state.applyOdds(raw);
    const payload: OddsEventPayload = {
      fixtureId: raw.FixtureId,
      bookmaker: raw.Bookmaker,
      superOddsType: raw.SuperOddsType,
      inRunning: raw.InRunning,
      marketPeriod: raw.MarketPeriod,
      marketParameters: raw.MarketParameters,
      priceNames: raw.PriceNames ?? [],
      prices: raw.Prices ?? [],
      ts: raw.Ts,
    };
    this.emitter.emit(EventName.OddsUpdate, payload);
  }

  private resolveAction(raw: RawScoreEvent): MatchAction {
    const d = raw.dataSoccer;
    // Boolean flags first: a scored penalty is a goal, so the flag wins over the raw action.
    if (d?.Goal) return MatchAction.Goal;
    if (d?.RedCard) return MatchAction.RedCard;
    if (d?.YellowCard) return MatchAction.YellowCard;
    if (d?.Corner) return MatchAction.Corner;
    // Raw action string covers the moments the flags don't — otherwise these arrived as `Unknown`
    // and the frontend's crowd/HatBot reactions for them never fired.
    const a = raw.action ?? '';
    if (a.includes('penalty')) return MatchAction.Penalty;
    if (a.includes('var')) return MatchAction.Var;
    if (a === 'substitution') return MatchAction.Substitution;
    // A free kick is a set-piece moment only when it isn't an offside flag.
    if (a === 'free_kick' && d?.FreeKickType !== 'Offside') return MatchAction.FreeKick;
    // Shots are frequent; only the ones that make the stands gasp deserve a beat.
    if (a === 'shot' && (d?.Outcome === 'OnTarget' || d?.Outcome === 'Woodwork')) return MatchAction.Shot;
    return MatchAction.Unknown;
  }

  private actionEvent(action: MatchAction, emission: EmissionState): EventName {
    const after = emission === EmissionState.After;
    switch (action) {
      case MatchAction.Goal:
        return after ? EventName.GoalAfter : EventName.GoalDuring;
      case MatchAction.RedCard:
        return after ? EventName.RedCardAfter : EventName.RedCardDuring;
      case MatchAction.YellowCard:
        return after ? EventName.YellowCardAfter : EventName.YellowCardDuring;
      case MatchAction.Corner:
        return after ? EventName.CornerAfter : EventName.CornerDuring;
      default:
        return after ? EventName.ScoreUpdateAfter : EventName.ScoreUpdateDuring;
    }
  }
}
