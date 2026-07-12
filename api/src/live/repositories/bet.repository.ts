import { Injectable } from '@nestjs/common';
import { BetStatus, type Bet, type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Sole owner of `bets` table access (docs/conventions.md). */
@Injectable()
export class BetRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.BetCreateInput): Promise<Bet> {
    return this.prisma.bet.create({ data });
  }

  findById(id: string): Promise<Bet | null> {
    return this.prisma.bet.findUnique({ where: { id } });
  }

  findByUser(userId: string): Promise<Bet[]> {
    return this.prisma.bet.findMany({ where: { userId }, orderBy: { placedAt: 'desc' } });
  }

  /** Open bets on a fixture — used by the settlement pass on `*.after`. */
  findPendingByFixture(fixtureId: number): Promise<Bet[]> {
    return this.prisma.bet.findMany({ where: { fixtureId, status: BetStatus.Pending } });
  }

  /**
   * Claim a bet for settlement iff it is still Pending — atomic, so the
   * client-reported path and the `match-end.after` pass can never both credit.
   * Returns the settled row, or null when someone else won the race.
   */
  async settleIfPending(id: string, status: BetStatus): Promise<Bet | null> {
    const { count } = await this.prisma.bet.updateMany({
      where: { id, status: BetStatus.Pending },
      data: { status, settledAt: new Date() },
    });
    return count === 1 ? this.prisma.bet.findUnique({ where: { id } }) : null;
  }
}
