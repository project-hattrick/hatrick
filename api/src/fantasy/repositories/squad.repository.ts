import { Injectable } from '@nestjs/common';
import { type Squad, type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Sole owner of `squads` + `squad_slots` access (the user's XI). */
@Injectable()
export class SquadRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.SquadCreateInput): Promise<Squad> {
    return this.prisma.squad.create({ data });
  }

  findByUser(userId: string): Promise<Squad[]> {
    return this.prisma.squad.findMany({
      where: { userId },
      include: { slots: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findActive(userId: string): Promise<Squad | null> {
    return this.prisma.squad.findFirst({
      where: { userId, isActive: true },
      include: { slots: { include: { ownedCard: { include: { card: true } } } } },
    });
  }

  /** Replaces the whole XI atomically: clears slots, then inserts the new set. */
  async replaceSlots(
    squadId: string,
    slots: Array<Omit<Prisma.SquadSlotCreateManyInput, 'squadId'>>,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.squadSlot.deleteMany({ where: { squadId } }),
      this.prisma.squadSlot.createMany({ data: slots.map((s) => ({ ...s, squadId })) }),
    ]);
  }
}
