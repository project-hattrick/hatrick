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
import { BetResponseDto, BetResultDto } from './dto/bet-response.dto';
import { CreateBetDto } from './dto/create-bet.dto';
import { SettleBetDto } from './dto/settle-bet.dto';
import { BettingService } from './services';

/**
 * Play-money bets (guarded, self-scoped). Distinct from the on-chain builder at
 * POST /bets/build in the chain module — that assembles a Solana transaction; these
 * routes move coins in the off-chain ledger.
 */
@ApiTags('Bets')
@Controller('bets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
export class BetsController {
  constructor(private readonly betting: BettingService) {}

  @Get()
  @ApiOperation({ summary: 'Your bets (newest first)' })
  @ApiOkResponse({ description: 'Bet history', type: [BetResponseDto] })
  list(@CurrentUser() principal: AuthenticatedUser): Promise<BetResponseDto[]> {
    return this.betting.list(principal.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Place a play-money bet' })
  @ApiCreatedResponse({ description: 'Bet placed + new balance', type: BetResultDto })
  place(
    @Body() dto: CreateBetDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<BetResultDto> {
    return this.betting.place(principal.userId, dto);
  }

  @Post(':id/settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Settle one of your pending bets' })
  @ApiOkResponse({ description: 'Bet settled + new balance', type: BetResultDto })
  settle(
    @Param('id') id: string,
    @Body() dto: SettleBetDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<BetResultDto> {
    return this.betting.settle(principal.userId, id, dto.status);
  }
}
