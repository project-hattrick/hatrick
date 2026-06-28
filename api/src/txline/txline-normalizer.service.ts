import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EmissionState } from '../events/enums/emission-state.enum';
import { EventName } from '../events/enums/event-name.enum';
import { MatchAction } from '../events/enums/match-action.enum';
import { MatchEventPayload, OddsEventPayload } from '../events/dto';
import { RawOddsEvent, RawScoreEvent } from './txline.types';
import { TournamentStateService } from './tournament-state.service';

/**
 * Maps raw TxLINE payloads to domain events and emits them in two states
 * (during/after) per the `confirmed` flag. Core of docs/architecture.md.
 */
@Injectable()
export class TxlineNormalizerService {
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
