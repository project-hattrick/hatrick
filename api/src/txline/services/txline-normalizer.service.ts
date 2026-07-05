import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EmissionState } from '../../events/enums/emission-state.enum';
import { EventName } from '../../events/enums/event-name.enum';
import { MatchAction } from '../../events/enums/match-action.enum';
import { MatchResultOutcome } from '../../events/enums/match-result-outcome.enum';
import { MatchEndPayload, MatchEventPayload, OddsEventPayload } from '../../events/dto';
import { RawOddsEvent, RawScoreEvent } from '../txline.types';
import { TournamentStateService } from './tournament-state.service';

/**
 * Maps raw TxLINE payloads to domain events and emits them in two states
 * (during/after) per the `confirmed` flag. Core of docs/architecture.md.
 */
@Injectable()
export class TxlineNormalizerService {
  /** Fixtures already ended — guards against duplicate `match-end.after` emits. */
  private readonly ended = new Set<number>();

  constructor(
    private readonly emitter: EventEmitter2,
    private readonly state: TournamentStateService,
  ) {}

  handleScore(raw: RawScoreEvent): void {
    this.state.applyScore(raw);
    const action = this.resolveAction(raw);
    const emission = raw.confirmed ? EmissionState.After : EmissionState.During;

    const payload: MatchEventPayload = {
      fixtureId: raw.fixtureId,
      action,
      state: emission,
      confirmed: raw.confirmed,
      seq: raw.seq,
      ts: raw.ts,
      minute: raw.dataSoccer?.Minutes,
      playerId: raw.dataSoccer?.PlayerId,
      participant: raw.dataSoccer?.Participant,
    };

    this.emitter.emit(this.actionEvent(action, emission), payload);
    this.emitter.emit(
      emission === EmissionState.After ? EventName.ScoreUpdateAfter : EventName.ScoreUpdateDuring,
      payload,
    );

    this.maybeEmitMatchEnd(raw);
  }

  /** Emit `match-end.after` once per fixture when a confirmed full-time arrives. */
  private maybeEmitMatchEnd(raw: RawScoreEvent): void {
    if (!raw.confirmed || !this.isFullTime(raw.gameState) || this.ended.has(raw.fixtureId)) return;
    this.ended.add(raw.fixtureId);

    const [homeScore, awayScore] = this.parseScore(raw);
    const payload: MatchEndPayload = {
      fixtureId: raw.fixtureId,
      seq: raw.seq,
      ts: raw.ts,
      homeScore,
      awayScore,
      outcome: this.resolveOutcome(homeScore, awayScore),
    };
    this.emitter.emit(EventName.MatchEndAfter, payload);
  }

  private isFullTime(gameState?: string): boolean {
    return !!gameState && /full[\s-]?time|finished|ended|\bft\b/i.test(gameState);
  }

  /** Best-effort home/away goal counts from the unstructured `scoreSoccer` blob. */
  private parseScore(raw: RawScoreEvent): [number?, number?] {
    const s = raw.scoreSoccer as Record<string, unknown> | undefined;
    const home = Number(s?.['Participant1'] ?? s?.['Home'] ?? s?.['home']);
    const away = Number(s?.['Participant2'] ?? s?.['Away'] ?? s?.['away']);
    return [Number.isFinite(home) ? home : undefined, Number.isFinite(away) ? away : undefined];
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
      priceNames: raw.PriceNames ?? [],
      prices: raw.Prices ?? [],
      ts: raw.Ts,
    };
    this.emitter.emit(EventName.OddsUpdate, payload);
  }

  private resolveAction(raw: RawScoreEvent): MatchAction {
    const d = raw.dataSoccer;
    if (!d) return MatchAction.Unknown;
    if (d.Goal) return MatchAction.Goal;
    if (d.RedCard) return MatchAction.RedCard;
    if (d.YellowCard) return MatchAction.YellowCard;
    if (d.Corner) return MatchAction.Corner;
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
