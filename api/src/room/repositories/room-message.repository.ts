import { Injectable } from '@nestjs/common';
import { type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Chat message row with its author user relation. */
export type RoomMessageWithUser = Prisma.RoomMessageGetPayload<{ include: { user: true } }>;

/** Persisted per-room chat messages. */
@Injectable()
export class RoomMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RoomMessageCreateInput): Promise<RoomMessageWithUser> {
    return this.prisma.roomMessage.create({ data, include: { user: true } });
  }

  listByRoom(roomId: string, limit = 50): Promise<RoomMessageWithUser[]> {
    return this.prisma.roomMessage.findMany({
      where: { roomId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }
}
