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

const DEFAULT_ROOM_NAME = 'Private room';
const CHAT_HISTORY_LIMIT = 50;

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
    return this.buildRoomDto(roomId);
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
    }
    return this.buildRoomDto(room.id);
  }

  async listMembers(roomId: string): Promise<RoomMemberDto[]> {
    const rows = await this.members.findByRoom(roomId);
    return rows.map((row) => RoomMemberDto.fromEntity(row));
  }

  async listMessages(roomId: string): Promise<RoomMessageDto[]> {
    const rows = await this.messages.listByRoom(roomId, CHAT_HISTORY_LIMIT);
    return rows.map((row) => RoomMessageDto.fromEntity(row));
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
    return dtoOut;
  }

  private async buildRoomDto(roomId: string): Promise<RoomDto> {
    const room = await this.rooms.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    return RoomDto.fromEntity(room);
  }
}
