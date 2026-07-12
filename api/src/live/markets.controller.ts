import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import type { MarketViewPayload } from '../events/dto';
import { MarketProjectorService } from './services';
import { MarketViewDto } from './dto/market-view-response.dto';

/**
 * Read-only snapshot of the normalized, tradeable markets a fixture currently offers — projected
 * from the live odds feed by MarketProjectorService. The socket `market.update` stream folds on top.
 */
@ApiTags('markets')
@Controller()
export class MarketsController {
  constructor(private readonly projector: MarketProjectorService) {}

  @Get('fixtures/:fixtureId/markets')
  @ApiOperation({ summary: 'Normalized tradeable markets projected from the live odds feed.' })
  @ApiParam({ name: 'fixtureId', type: Number })
  @ApiOkResponse({ type: MarketViewDto, isArray: true })
  getMarkets(@Param('fixtureId', ParseIntPipe) fixtureId: number): MarketViewPayload[] {
    return this.projector.getFixtureMarkets(fixtureId);
  }
}
