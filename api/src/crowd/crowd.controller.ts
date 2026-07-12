import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CrowdService } from './crowd.service';
import { SendCrowdMessageDto } from './dto/crowd-message.dto';

/** Viewer → stands: a chat message that becomes a balloon for every watcher. */
@ApiTags('Crowd')
@Controller('crowd')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
export class CrowdController {
  constructor(private readonly crowd: CrowdService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a crowd message (broadcast to all viewers)' })
  @ApiOkResponse({ description: 'Message accepted and broadcast' })
  @ApiTooManyRequestsResponse({ description: 'Rate limited — one message per 2s' })
  send(
    @Body() dto: SendCrowdMessageDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    return this.crowd.send(principal.userId, dto);
  }
}
