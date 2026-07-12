import { Injectable } from '@nestjs/common';
import { FriendshipStatus, type Friendship, type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Friendship row with both parties' profiles attached — what list endpoints return. */
export type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
  include: { requester: true; addressee: true };
}>;

const WITH_USERS = { requester: true, addressee: true } as const;

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
  listFriends(userId: string): Promise<FriendshipWithUsers[]> {
    return this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.Accepted,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: WITH_USERS,
    });
  }

  /** Pending requests sent TO the user (incoming). */
  listIncoming(userId: string): Promise<FriendshipWithUsers[]> {
    return this.prisma.friendship.findMany({
      where: { addresseeId: userId, status: FriendshipStatus.Pending },
      include: WITH_USERS,
    });
  }

  /** Pending requests the user sent (outgoing). */
  listOutgoing(userId: string): Promise<FriendshipWithUsers[]> {
    return this.prisma.friendship.findMany({
      where: { requesterId: userId, status: FriendshipStatus.Pending },
      include: WITH_USERS,
    });
  }

  remove(id: string): Promise<Friendship> {
    return this.prisma.friendship.delete({ where: { id } });
  }
}
