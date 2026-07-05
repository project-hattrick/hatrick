import { Injectable } from '@nestjs/common';
import { RawOddsEvent, RawScoreEvent } from '../txline.types';
import { TournamentSnapshot } from '../../events/dto';

/** In-memory tournament state. Generic base — swap for Redis/DB later. */
@Injectable()
export class TournamentStateService {
  private readonly scores = new Map<number, RawScoreEvent>();
  private readonly odds = new Map<number, RawOddsEvent>();

  applyScore(event: RawScoreEvent): void {
    this.scores.set(event.fixtureId, event);
  }

  applyOdds(event: RawOddsEvent): void {
    this.odds.set(event.FixtureId, event);
  }

  getSnapshot(): TournamentSnapshot {
    return { fixtures: [...this.scores.keys()], updatedAt: Date.now() };
  }
}
