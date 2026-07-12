import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

/** In-app bell feed (guarded, self-scoped). Writes happen via domain triggers, not here. */
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Your notifications (newest first)' })
  @ApiOkResponse({ description: 'Notification feed', type: [NotificationDto] })
  list(@CurrentUser() principal: AuthenticatedUser): Promise<NotificationDto[]> {
    return this.notifications.list(principal.userId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark every unread notification as read' })
  @ApiOkResponse({ description: 'Count of notifications updated' })
  readAll(@CurrentUser() principal: AuthenticatedUser): Promise<{ updated: number }> {
    return this.notifications.markAllRead(principal.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiOkResponse({ description: 'Updated notification', type: NotificationDto })
  read(
    @Param('id') id: string,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<NotificationDto> {
    return this.notifications.markRead(principal.userId, id);
  }
}
