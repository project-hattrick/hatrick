import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RoomMemberRole,
  RoomStatus,
  type Room,
  type RoomMember,
  type RoomMessage,
  type User,
} from '@prisma/client';
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Rows as loaded with their `user` relation (see repositories). */
type RoomMemberWithUser = RoomMember & { user: User };
type RoomMessageWithUser = RoomMessage & { user: User };
type RoomWithMembers = Room & { members?: RoomMemberWithUser[] };

/** Best-effort display name for a member/author. */
const displayNameOf = (user: User): string =>
  user.displayName ?? user.username ?? user.walletAddress.slice(0, 6);

export class CreateRoomDto {
  @ApiPropertyOptional({ description: 'Room name', example: 'Private room' })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ description: 'Live fixture id mirrored at creation' })
  @IsInt()
  @IsOptional()
  fixtureId?: number;
}

export class JoinRoomDto {
  @ApiProperty({ description: 'Invite token from the share link' })
  @IsString()
  inviteToken!: string;
}

export class PostMessageDto {
  @ApiProperty({ description: 'Chat message body', example: 'Vamos Argentina!' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  body!: string;
}

export class RoomMemberDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ nullable: true, type: String }) avatarUrl!: string | null;
  @ApiProperty({ enum: RoomMemberRole }) role!: RoomMemberRole;
  @ApiProperty() joinedAt!: Date;

  static fromEntity(member: RoomMemberWithUser): RoomMemberDto {
    const dto = new RoomMemberDto();
    dto.id = member.id;
    dto.userId = member.userId;
    dto.displayName = displayNameOf(member.user);
    dto.avatarUrl = member.user.avatarUrl ?? member.user.portraitSrc ?? null;
    dto.role = member.role;
    dto.joinedAt = member.joinedAt;
    return dto;
  }
}

export class RoomMessageDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() author!: string;
  @ApiProperty() body!: string;
  @ApiProperty() createdAt!: Date;

  static fromEntity(message: RoomMessageWithUser): RoomMessageDto {
    const dto = new RoomMessageDto();
    dto.id = message.id;
    dto.userId = message.userId;
    dto.author = displayNameOf(message.user);
    dto.body = message.body;
    dto.createdAt = message.createdAt;
    return dto;
  }
}

export class RoomDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: RoomStatus }) status!: RoomStatus;
  @ApiProperty({ description: 'Invite token (build the share link)' }) inviteToken!: string;
  @ApiProperty() hostId!: string;
  @ApiProperty({ nullable: true, type: Number }) fixtureId!: number | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ type: [RoomMemberDto] }) members!: RoomMemberDto[];

  static fromEntity(room: RoomWithMembers): RoomDto {
    const dto = new RoomDto();
    dto.id = room.id;
    dto.name = room.name;
    dto.status = room.status;
    dto.inviteToken = room.inviteToken;
    dto.hostId = room.hostId;
    dto.fixtureId = room.fixtureId;
    dto.createdAt = room.createdAt;
    dto.members = (room.members ?? []).map((member) => RoomMemberDto.fromEntity(member));
    return dto;
  }
}

export class CreateRoomResultDto {
  @ApiProperty({ type: RoomDto }) room!: RoomDto;
}
