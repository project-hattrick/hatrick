import { Injectable } from '@nestjs/common';
import { FriendshipStatus, type Friendship, type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Sole owner of `friendships` access — directed request rows. */
@Injectable()
export class FriendshipRepository {
  constructor(private readonly prisma: PrismaService) {}

  request(requesterId: string, addresseeId: string): Promise<Friendship> {
    return this.prisma.friendship.create({ data: { requesterId, addresseeId } });
  }

  /** The single row between two users, in either direction. */
  findBetween(a: string, b: string): Promise<Friendship | null> {
    return this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
    });
  }

  respond(id: string, status: FriendshipStatus): Promise<Friendship> {
    return this.prisma.friendship.update({
      where: { id },
      data: { status, respondedAt: new Date() },
    });
  }

  /** Accepted friendships involving the user, in either direction. */
  listFriends(userId: string): Promise<Friendship[]> {
    return this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.Accepted,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });
  }

  /** Pending requests sent TO the user (incoming). */
  listIncoming(userId: string): Promise<Friendship[]> {
    return this.prisma.friendship.findMany({
      where: { addresseeId: userId, status: FriendshipStatus.Pending },
    });
  }

  remove(id: string): Promise<Friendship> {
    return this.prisma.friendship.delete({ where: { id } });
  }
}
