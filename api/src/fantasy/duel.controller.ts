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
import { CreateDuelDto, DuelDto, DuelResultDto, SettleDuelDto } from './dto/duel.dto';
import { DuelService } from './services';

/** 1v1 duels (guarded, self-scoped via the session cookie). */
@ApiTags('Duels')
@Controller('duels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
export class DuelController {
  constructor(private readonly duels: DuelService) {}

  @Get()
  @ApiOperation({ summary: 'Your duel history' })
  @ApiOkResponse({ description: 'Duels, newest first', type: [DuelDto] })
  list(@CurrentUser() principal: AuthenticatedUser): Promise<DuelDto[]> {
    return this.duels.list(principal.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Start a duel (stake + lineup snapshot)' })
  @ApiCreatedResponse({ description: 'Duel + new balance', type: DuelResultDto })
  create(
    @Body() dto: CreateDuelDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<DuelResultDto> {
    return this.duels.create(principal.userId, dto);
  }

  @Post(':id/settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Settle a duel (result + reward + MMR)' })
  @ApiOkResponse({ description: 'Settled duel + new balance', type: DuelResultDto })
  settle(
    @Param('id') id: string,
    @Body() dto: SettleDuelDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<DuelResultDto> {
    return this.duels.settle(principal.userId, id, dto);
  }
}
