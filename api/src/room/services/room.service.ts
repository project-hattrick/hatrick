import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomMemberRole, RoomStatus } from '@prisma/client';

import {
  RoomMemberRepository,
  RoomMessageRepository,
  RoomRepository,
} from '../repositories';
import {
  CreateRoomDto,
  CreateRoomResultDto,
  JoinRoomDto,
  PostMessageDto,
  RoomDto,
  RoomMemberDto,
  RoomMessageDto,
} from '../dto/room.dto';
import { RoomGateway } from '../room.gateway';
import { CacheService } from '../../common/cache/cache.service';

const DEFAULT_ROOM_NAME = 'Private room';
const CHAT_HISTORY_LIMIT = 50;

// Room reads are HTTP-authoritative and low-churn; the gateway relays live changes, so short TTLs plus
// a bust on the mutating write keep initial loads cheap without fighting the socket.
const ROOM_TTL = 60;
const MEMBERS_TTL = 60;
const MESSAGES_TTL = 30;
const roomKey = (id: string) => `room:${id}`;
const membersKey = (id: string) => `room:members:${id}`;
const messagesKey = (id: string) => `room:messages:${id}`;

/**
 * Invite-only "watch together" rooms over the current live match. HTTP is the
 * authority for membership/chat persistence; the gateway relays chat/presence.
 */
@Injectable()
export class RoomService {
  constructor(
    private readonly rooms: RoomRepository,
    private readonly members: RoomMemberRepository,
    private readonly messages: RoomMessageRepository,
    private readonly gateway: RoomGateway,
    private readonly cache: CacheService,
  ) {}

  async create(userId: string, dto: CreateRoomDto): Promise<CreateRoomResultDto> {
    const room = await this.rooms.create({
      host: { connect: { id: userId } },
      name: dto.name?.trim() || DEFAULT_ROOM_NAME,
      status: RoomStatus.Open,
      inviteToken: randomBytes(16).toString('base64url'),
      fixtureId: dto.fixtureId ?? null,
    });
    await this.members.add({
      room: { connect: { id: room.id } },
      user: { connect: { id: userId } },
      role: RoomMemberRole.Host,
    });
    return { room: await this.buildRoomDto(room.id) };
  }

  async getById(roomId: string): Promise<RoomDto> {
    const cached = await this.cache.get<RoomDto>(roomKey(roomId));
    if (cached) return cached;
    const dto = await this.buildRoomDto(roomId);
    await this.cache.set(roomKey(roomId), dto, ROOM_TTL);
    return dto;
  }

  async join(userId: string, dto: JoinRoomDto): Promise<RoomDto> {
    const room = await this.rooms.findByInviteToken(dto.inviteToken);
    if (!room) throw new NotFoundException('Room not found');
    if (room.status === RoomStatus.Closed) throw new BadRequestException('Room is closed');

    const already = await this.members.exists(room.id, userId);
    if (!already) {
      const member = await this.members.add({
        room: { connect: { id: room.id } },
        user: { connect: { id: userId } },
        role: RoomMemberRole.Member,
      });
      const withUser = (await this.members.findByRoom(room.id)).find((m) => m.id === member.id);
      if (withUser) this.gateway.broadcastMemberJoined(room.id, RoomMemberDto.fromEntity(withUser));
      // New member changes both the roster and the room DTO — drop the stale reads.
      await Promise.all([this.cache.del(membersKey(room.id)), this.cache.del(roomKey(room.id))]);
    }
    return this.buildRoomDto(room.id);
  }

  async listMembers(roomId: string): Promise<RoomMemberDto[]> {
    const cached = await this.cache.get<RoomMemberDto[]>(membersKey(roomId));
    if (cached) return cached;
    const rows = await this.members.findByRoom(roomId);
    const dtos = rows.map((row) => RoomMemberDto.fromEntity(row));
    await this.cache.set(membersKey(roomId), dtos, MEMBERS_TTL);
    return dtos;
  }

  async listMessages(roomId: string): Promise<RoomMessageDto[]> {
    const cached = await this.cache.get<RoomMessageDto[]>(messagesKey(roomId));
    if (cached) return cached;
    const rows = await this.messages.listByRoom(roomId, CHAT_HISTORY_LIMIT);
    const dtos = rows.map((row) => RoomMessageDto.fromEntity(row));
    await this.cache.set(messagesKey(roomId), dtos, MESSAGES_TTL);
    return dtos;
  }

  async postMessage(userId: string, roomId: string, dto: PostMessageDto): Promise<RoomMessageDto> {
    const isMember = await this.members.exists(roomId, userId);
    if (!isMember) throw new ForbiddenException('Join the room to chat');

    const row = await this.messages.create({
      room: { connect: { id: roomId } },
      user: { connect: { id: userId } },
      body: dto.body.trim(),
    });
    const dtoOut = RoomMessageDto.fromEntity(row);
    this.gateway.broadcastChat(roomId, dtoOut);
    await this.cache.del(messagesKey(roomId));
    return dtoOut;
  }

  private async buildRoomDto(roomId: string): Promise<RoomDto> {
    const room = await this.rooms.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    return RoomDto.fromEntity(room);
  }
}
