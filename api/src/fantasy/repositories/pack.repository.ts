import { Injectable } from '@nestjs/common';
import { type PackOpening, type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Sole owner of `pack_openings` access. */
@Injectable()
export class PackRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PackOpeningCreateInput): Promise<PackOpening> {
    return this.prisma.packOpening.create({ data });
  }

  findByUser(userId: string): Promise<PackOpening[]> {
    return this.prisma.packOpening.findMany({
      where: { userId },
      include: { cards: true },
      orderBy: { openedAt: 'desc' },
    });
  }
}
