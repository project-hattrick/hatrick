import { Injectable } from '@nestjs/common';
import { type Prisma, type RoomMember } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Membership row with its user relation. */
export type RoomMemberWithUser = Prisma.RoomMemberGetPayload<{ include: { user: true } }>;

/** Membership rows joining users to rooms (host + invited friends). */
@Injectable()
export class RoomMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  add(data: Prisma.RoomMemberCreateInput): Promise<RoomMember> {
    return this.prisma.roomMember.create({ data });
  }

  findByRoom(roomId: string): Promise<RoomMemberWithUser[]> {
    return this.prisma.roomMember.findMany({
      where: { roomId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async exists(roomId: string, userId: string): Promise<boolean> {
    const row = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    return row !== null;
  }
}
