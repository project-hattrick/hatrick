import { Injectable } from '@nestjs/common';
import { DuelStatus, type Duel, type DuelLineup, type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Sole owner of `duels` + `duel_lineups` access (1v1 history). */
@Injectable()
export class DuelRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.DuelCreateInput): Promise<Duel> {
    return this.prisma.duel.create({ data });
  }

  findById(id: string): Promise<Duel | null> {
    return this.prisma.duel.findUnique({ where: { id }, include: { lineups: true } });
  }

  /** All duels a user took part in (as host or guest), newest first, with frozen lineups. */
  findByUser(userId: string): Promise<Duel[]> {
    return this.prisma.duel.findMany({
      where: { OR: [{ hostId: userId }, { guestId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: { lineups: true },
    });
  }

  updateStatus(id: string, status: DuelStatus): Promise<Duel> {
    return this.prisma.duel.update({ where: { id }, data: { status } });
  }

  finish(id: string, data: Prisma.DuelUpdateInput): Promise<Duel> {
    return this.prisma.duel.update({
      where: { id },
      data: { ...data, status: DuelStatus.Finished, finishedAt: new Date() },
    });
  }

  /** Freezes a participant's XI at kickoff (immutable snapshot). */
  addLineup(data: Prisma.DuelLineupCreateInput): Promise<DuelLineup> {
    return this.prisma.duelLineup.create({ data });
  }
}
