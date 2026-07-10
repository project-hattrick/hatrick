import { Injectable } from '@nestjs/common';
import { RoomStatus, type Prisma, type Room } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Room row with its members (each carrying the member's user). */
export type RoomWithMembers = Prisma.RoomGetPayload<{
  include: { members: { include: { user: true } } };
}>;

/** Sole owner of `rooms` access (invite-only watch-together sessions). */
@Injectable()
export class RoomRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RoomCreateInput): Promise<Room> {
    return this.prisma.room.create({ data });
  }

  findById(id: string): Promise<RoomWithMembers | null> {
    return this.prisma.room.findUnique({
      where: { id },
      include: { members: { include: { user: true }, orderBy: { joinedAt: 'asc' } } },
    });
  }

  findByInviteToken(inviteToken: string): Promise<Room | null> {
    return this.prisma.room.findUnique({ where: { inviteToken } });
  }

  close(id: string): Promise<Room> {
    return this.prisma.room.update({
      where: { id },
      data: { status: RoomStatus.Closed, closedAt: new Date() },
    });
  }
}
