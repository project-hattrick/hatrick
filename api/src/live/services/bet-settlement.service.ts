import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BetStatus, MarketType, NotificationType, type Bet } from '@prisma/client';

import { EventName, MarketSelection, MatchResultOutcome } from '../../events/enums';
import type { MatchEndPayload } from '../../events/dto/match-end.dto';
import { NotificationsService } from '../../users/notifications.service';
import { BetRepository } from '../repositories';
import { BettingService } from './betting.service';
import type { SettleableStatus } from '../dto/settle-bet.dto';

/** The only line the front offers on TotalGoals (see front lib/live-odds.ts). */
const TOTAL_GOALS_LINE = 2.5;

const OUTCOME_BY_SELECTION: Partial<Record<string, MatchResultOutcome>> = {
  [MarketSelection.Home]: MatchResultOutcome.Home,
  [MarketSelection.Draw]: MatchResultOutcome.Draw,
  [MarketSelection.Away]: MatchResultOutcome.Away,
};

/**
 * TxLINE-driven settlement: on `match-end.after` every pending bet on the fixture
 * is resolved from the authoritative final score, credited through the wallet
 * ledger, and surfaced as a bell notification. Regulation-time score is the
 * settlement basis when present (standard 1X2 / O-U convention).
 */
@Injectable()
export class BetSettlementService {
  private readonly logger = new Logger(BetSettlementService.name);

  constructor(
    private readonly bets: BetRepository,
    private readonly betting: BettingService,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent(EventName.MatchEndAfter)
  async onMatchEnd(payload: MatchEndPayload): Promise<void> {
    const homeScore = payload.regulationHomeScore ?? payload.homeScore;
    const awayScore = payload.regulationAwayScore ?? payload.awayScore;
    if (homeScore === undefined || awayScore === undefined) {
      this.logger.warn(`fixture ${payload.fixtureId} ended without a parseable score — skipping`);
      return;
    }

    const pending = await this.bets.findPendingByFixture(payload.fixtureId);
    if (pending.length === 0) return;
    this.logger.log(`settling ${pending.length} bet(s) on fixture ${payload.fixtureId}`);

    const outcome =
      payload.regulationOutcome ?? payload.outcome ?? this.outcomeOf(homeScore, awayScore);
    for (const bet of pending) {
      const status = this.resolve(bet, homeScore, awayScore, outcome);
      const settled = await this.betting.systemSettle(bet, status);
      if (!settled) continue; // raced with a client report — already credited
      await this.pushNotification(settled, status);
    }
  }

  /**
   * Resolve a bet from the final score. Only markets the score can decide are
   * settled Won/Lost; everything else is voided (stake refund) — the server
   * never rolls dice, deliberately diverging from the mock's probabilistic roll.
   */
  private resolve(
    bet: Bet,
    homeScore: number,
    awayScore: number,
    outcome: MatchResultOutcome,
  ): SettleableStatus {
    if (bet.market === MarketType.MatchResult) {
      const picked = OUTCOME_BY_SELECTION[bet.selection];
      if (!picked) return BetStatus.Void;
      return picked === outcome ? BetStatus.Won : BetStatus.Lost;
    }
    if (bet.market === MarketType.TotalGoals) {
      const total = homeScore + awayScore;
      if (bet.selection === MarketSelection.Over) {
        return total > TOTAL_GOALS_LINE ? BetStatus.Won : BetStatus.Lost;
      }
      if (bet.selection === MarketSelection.Under) {
        return total < TOTAL_GOALS_LINE ? BetStatus.Won : BetStatus.Lost;
      }
      return BetStatus.Void;
    }
    return BetStatus.Void;
  }

  private outcomeOf(homeScore: number, awayScore: number): MatchResultOutcome {
    if (homeScore > awayScore) return MatchResultOutcome.Home;
    if (homeScore < awayScore) return MatchResultOutcome.Away;
    return MatchResultOutcome.Draw;
  }

  private async pushNotification(bet: Bet, status: SettleableStatus): Promise<void> {
    const payout = Math.round(Number(bet.stake) * Number(bet.oddsTaken));
    const title =
      status === BetStatus.Won ? 'Bet won' : status === BetStatus.Void ? 'Bet voided' : 'Bet lost';
    const detail =
      status === BetStatus.Won
        ? `+${payout} coins`
        : status === BetStatus.Void
          ? 'stake refunded'
          : `-${Math.round(Number(bet.stake))} coins`;
    try {
      await this.notifications.notify(bet.userId, {
        type: NotificationType.Bet,
        title,
        body: `${bet.market} · ${bet.selection} — ${detail}`,
        href: '/bets',
      });
    } catch (error) {
      this.logger.warn(`settlement notification failed: ${(error as Error).message}`);
    }
  }
}
