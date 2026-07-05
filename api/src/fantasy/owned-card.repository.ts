import { Injectable } from '@nestjs/common';
import { type OwnedCard, type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/** Sole owner of `owned_cards` access — a user's card arsenal. */
@Injectable()
export class OwnedCardRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.OwnedCardCreateInput): Promise<OwnedCard> {
    return this.prisma.ownedCard.create({ data });
  }

  findById(id: string): Promise<OwnedCard | null> {
    return this.prisma.ownedCard.findUnique({ where: { id } });
  }

  findByUser(userId: string): Promise<OwnedCard[]> {
    return this.prisma.ownedCard.findMany({
      where: { userId },
      include: { card: true },
      orderBy: { acquiredAt: 'desc' },
    });
  }

  /** Transfers a copy to a new owner (market purchase). */
  transferOwner(id: string, newUserId: string): Promise<OwnedCard> {
    return this.prisma.ownedCard.update({
      where: { id },
      data: { user: { connect: { id: newUserId } } },
    });
  }

  delete(id: string): Promise<OwnedCard> {
    return this.prisma.ownedCard.delete({ where: { id } });
  }
}
