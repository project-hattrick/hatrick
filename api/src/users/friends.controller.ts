import {
  Body,
  Controller,
  Delete,
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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendRequestDto, FriendsSnapshotDto, RespondFriendDto } from './dto/friend.dto';
import { FriendsService } from './friends.service';

/** Friend graph (guarded, self-scoped) — routes keyed by the counterpart's userId. */
@ApiTags('Friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  @Get()
  @ApiOperation({ summary: 'Your friends + pending requests (both directions)' })
  @ApiOkResponse({ description: 'Friend graph snapshot', type: FriendsSnapshotDto })
  snapshot(@CurrentUser() principal: AuthenticatedUser): Promise<FriendsSnapshotDto> {
    return this.friends.snapshot(principal.userId);
  }

  @Post('requests')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiCreatedResponse({ description: 'Request created (addressee is notified)' })
  request(
    @Body() dto: FriendRequestDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<void> {
    return this.friends.request(principal.userId, dto.userId);
  }

  @Post('respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept or decline a pending request' })
  @ApiOkResponse({ description: 'Request answered (requester notified on accept)' })
  respond(
    @Body() dto: RespondFriendDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<void> {
    return this.friends.respond(principal.userId, dto.userId, dto.accept);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unfriend, or cancel your own pending request' })
  @ApiNoContentResponse({ description: 'Friendship removed' })
  remove(
    @Param('userId') userId: string,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<void> {
    return this.friends.remove(principal.userId, userId);
  }
}
