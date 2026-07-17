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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateDuelDto,
  DuelDetailDto,
  DuelDto,
  DuelResultDto,
  EnterMatchmakingDto,
  JoinDuelDto,
  SettleDuelDto,
} from './dto/duel.dto';
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

  @Get(':id')
  @ApiOperation({
    summary: 'Duel detail — both players + frozen lineups',
    description:
      'Pending duels are readable by any authenticated user (so the invitee can load the join screen). ' +
      'Live/Finished duels are restricted to the two participants.',
  })
  @ApiOkResponse({ description: 'Full duel detail', type: DuelDetailDto })
  get(
    @Param('id') id: string,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<DuelDetailDto> {
    return this.duels.get(principal.userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Start a duel (stake + lineup snapshot)' })
  @ApiCreatedResponse({
    description: 'Duel + new balance',
    type: DuelResultDto,
  })
  create(
    @Body() dto: CreateDuelDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<DuelResultDto> {
    return this.duels.create(principal.userId, dto);
  }

  @Post('matchmaking/enter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enter ranked matchmaking with the current XI' })
  enterMatchmaking(
    @Body() dto: EnterMatchmakingDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<{ status: 'queued' | 'matched'; duelId?: string }> {
    return this.duels.enterMatchmaking(principal.userId, dto);
  }

  @Delete('matchmaking/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave ranked matchmaking' })
  leaveMatchmaking(@CurrentUser() principal: AuthenticatedUser): void {
    this.duels.leaveMatchmaking(principal.userId);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Join an open PvP duel (stake + lineup); arms the on-chain escrow',
  })
  @ApiOkResponse({
    description: 'Joined duel + new balance',
    type: DuelResultDto,
  })
  join(
    @Param('id') id: string,
    @Body() dto: JoinDuelDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<DuelResultDto> {
    return this.duels.join(principal.userId, id, dto);
  }

  @Post(':id/settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Settle a duel (result + reward + MMR)' })
  @ApiOkResponse({
    description: 'Settled duel + new balance',
    type: DuelResultDto,
  })
  settle(
    @Param('id') id: string,
    @Body() dto: SettleDuelDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<DuelResultDto> {
    return this.duels.settle(principal.userId, id, dto);
  }
}
