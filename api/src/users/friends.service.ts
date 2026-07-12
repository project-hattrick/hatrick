import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus, NotificationType, type User } from '@prisma/client';

import { NotificationsService } from './notifications.service';
import { FriendshipRepository, UserRepository, type FriendshipWithUsers } from './repositories';
import { FriendsSnapshotDto } from './dto/friend.dto';
import { UserResponseDto } from './dto/user-response.dto';

/** Public label for a user in notification copy. */
const label = (user: User): string =>
  user.displayName ?? user.username ?? `${user.walletAddress.slice(0, 4)}…${user.walletAddress.slice(-4)}`;

/**
 * Friend graph over directed friendship rows. Endpoints are keyed by the
 * counterpart's userId (row ids stay server-internal) so the client can drive
 * everything off the id lists it already renders.
 */
@Injectable()
export class FriendsService {
  constructor(
    private readonly friendships: FriendshipRepository,
    private readonly users: UserRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async snapshot(userId: string): Promise<FriendsSnapshotDto> {
    const [friends, incoming, outgoing] = await Promise.all([
      this.friendships.listFriends(userId),
      this.friendships.listIncoming(userId),
      this.friendships.listOutgoing(userId),
    ]);
    const counterpart = (row: FriendshipWithUsers): User =>
      row.requesterId === userId ? row.addressee : row.requester;
    return {
      friends: friends.map((row) => UserResponseDto.fromEntity(counterpart(row))),
      incoming: incoming.map((row) => UserResponseDto.fromEntity(row.requester)),
      outgoing: outgoing.map((row) => UserResponseDto.fromEntity(row.addressee)),
    };
  }

  async request(userId: string, addresseeId: string): Promise<void> {
    if (userId === addresseeId) throw new BadRequestException('Cannot befriend yourself');
    const addressee = await this.users.findById(addresseeId);
    if (!addressee) throw new NotFoundException('User not found');

    const existing = await this.friendships.findBetween(userId, addresseeId);
    if (existing) {
      // A declined request may be retried; anything else is already in flight.
      if (existing.status !== FriendshipStatus.Declined) {
        throw new ConflictException('A friendship already exists between these users');
      }
      await this.friendships.remove(existing.id);
    }

    await this.friendships.request(userId, addresseeId);
    const requester = await this.users.findById(userId);
    if (requester) {
      await this.notifications.notify(addresseeId, {
        type: NotificationType.Friend,
        title: 'New friend request',
        body: `${label(requester)} wants to be your friend.`,
        href: '/duelists',
      });
    }
  }

  async respond(userId: string, requesterId: string, accept: boolean): Promise<void> {
    const existing = await this.friendships.findBetween(userId, requesterId);
    if (
      !existing ||
      existing.status !== FriendshipStatus.Pending ||
      existing.addresseeId !== userId
    ) {
      throw new NotFoundException('No pending request from this user');
    }

    await this.friendships.respond(
      existing.id,
      accept ? FriendshipStatus.Accepted : FriendshipStatus.Declined,
    );
    if (accept) {
      const addressee = await this.users.findById(userId);
      if (addressee) {
        await this.notifications.notify(requesterId, {
          type: NotificationType.Friend,
          title: 'Friend request accepted',
          body: `${label(addressee)} accepted your request.`,
          href: '/duelists',
        });
      }
    }
  }

  /** Unfriend (Accepted) or cancel your own pending request. */
  async remove(userId: string, otherId: string): Promise<void> {
    const existing = await this.friendships.findBetween(userId, otherId);
    if (!existing) throw new NotFoundException('No friendship to remove');
    const removable =
      existing.status === FriendshipStatus.Accepted ||
      (existing.status === FriendshipStatus.Pending && existing.requesterId === userId);
    if (!removable) throw new NotFoundException('No friendship to remove');
    await this.friendships.remove(existing.id);
  }
}
