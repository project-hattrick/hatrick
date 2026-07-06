import { Controller, Get, UseGuards } from '@nestjs/common';
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
import { WalletTransactionDto } from './dto/wallet-transaction.dto';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  /** The signed-in user's own ledger. Balance itself comes from GET /auth/me. */
  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Your recent wallet transactions' })
  @ApiOkResponse({ description: 'Ledger entries, newest first', type: [WalletTransactionDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  transactions(@CurrentUser() principal: AuthenticatedUser): Promise<WalletTransactionDto[]> {
    return this.wallet.history(principal.userId);
  }
}
