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

  findByUser(userId: string): Promise<Bet[]> {
    return this.prisma.bet.findMany({ where: { userId }, orderBy: { placedAt: 'desc' } });
  }

  /** Open bets on a fixture — used by the settlement pass on `*.after`. */
  findPendingByFixture(fixtureId: number): Promise<Bet[]> {
    return this.prisma.bet.findMany({ where: { fixtureId, status: BetStatus.Pending } });
  }

  settle(id: string, status: BetStatus): Promise<Bet> {
    return this.prisma.bet.update({
      where: { id },
      data: { status, settledAt: new Date() },
    });
  }
}
