import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateRoomDto,
  CreateRoomResultDto,
  JoinRoomDto,
  PostMessageDto,
  RoomDto,
  RoomMemberDto,
  RoomMessageDto,
} from './dto/room.dto';
import { RoomService } from './services';

/** Invite-only watch-together rooms (guarded; membership is server authority). */
@ApiTags('Rooms')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
export class RoomController {
  constructor(private readonly rooms: RoomService) {}

  @Post()
  @ApiOperation({ summary: 'Create a private room (host joins automatically)' })
  @ApiCreatedResponse({ description: 'Room + invite token', type: CreateRoomResultDto })
  create(
    @Body() dto: CreateRoomDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<CreateRoomResultDto> {
    return this.rooms.create(principal.userId, dto);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a room via its invite token' })
  @ApiOkResponse({ description: 'Room after joining', type: RoomDto })
  join(@Body() dto: JoinRoomDto, @CurrentUser() principal: AuthenticatedUser): Promise<RoomDto> {
    return this.rooms.join(principal.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Read a room by id' })
  @ApiOkResponse({ description: 'Room + members', type: RoomDto })
  getById(@Param('id') id: string): Promise<RoomDto> {
    return this.rooms.getById(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List room members' })
  @ApiOkResponse({ description: 'Members, join order', type: [RoomMemberDto] })
  members(@Param('id') id: string): Promise<RoomMemberDto[]> {
    return this.rooms.listMembers(id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Room chat history' })
  @ApiOkResponse({ description: 'Messages, oldest first', type: [RoomMessageDto] })
  messages(@Param('id') id: string): Promise<RoomMessageDto[]> {
    return this.rooms.listMessages(id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Post a chat message (members only)' })
  @ApiCreatedResponse({ description: 'Persisted message', type: RoomMessageDto })
  postMessage(
    @Param('id') id: string,
    @Body() dto: PostMessageDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<RoomMessageDto> {
    return this.rooms.postMessage(principal.userId, id, dto);
  }
}
