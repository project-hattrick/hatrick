import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
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
import { MarketResultDto, MarketTradeDto } from './dto/market-trade.dto';
import { MarketService } from './market.service';

/** Play-money card market — economy side (guarded, self-scoped via the session cookie). */
@ApiTags('Market')
@Controller('market')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Post('buy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buy a card (debit + ledger)' })
  @ApiOkResponse({ description: 'New balance', type: MarketResultDto })
  buy(
    @Body() dto: MarketTradeDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<MarketResultDto> {
    return this.market.buy(principal.userId, dto);
  }

  @Post('sell')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sell a card (credit + ledger)' })
  @ApiOkResponse({ description: 'New balance', type: MarketResultDto })
  sell(
    @Body() dto: MarketTradeDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<MarketResultDto> {
    return this.market.sell(principal.userId, dto);
  }
}
