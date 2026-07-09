import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
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
import { PurchaseItemDto, StoreItemDto, StorePurchaseResultDto } from './dto/store-item.dto';
import { StoreService } from './store.service';

/** Limited-stock team store — public catalog, guarded purchases. */
@ApiTags('Store')
@Controller('store')
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'List active store items with remaining stock' })
  @ApiOkResponse({ type: [StoreItemDto] })
  catalog(): Promise<StoreItemDto[]> {
    return this.store.catalog();
  }

  @Post('purchase')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  @ApiOperation({ summary: 'Buy one unit (atomic stock claim + debit + ledger)' })
  @ApiOkResponse({ description: 'New balance + remaining stock', type: StorePurchaseResultDto })
  purchase(
    @Body() dto: PurchaseItemDto,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<StorePurchaseResultDto> {
    return this.store.purchase(principal.userId, dto.slug);
  }
}
