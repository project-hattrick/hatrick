import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PublicKey } from '@solana/web3.js';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { assertWalletOwner } from '../auth/wallet-owner.util';
import { MarketType } from '../events/enums/market-type.enum';
import { BetService } from './services/bet.service';

interface BuildBetBody {
  walletAddress?: string;
  fixtureId?: number;
  market?: MarketType;
  selection?: string;
  amount?: number;
  oddsBps?: number;
}

@ApiTags('Bets')
@Controller('bets')
export class BetController {
  constructor(private readonly bets: BetService) {}

  /** Assemble an unsigned place_position transaction for the wallet to sign. */
  @Post('build')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async build(
    @Body() body: BuildBetBody,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ transaction: string }> {
    const { walletAddress, fixtureId, market, selection, amount } = body;
    if (!walletAddress || fixtureId === undefined || !market || !selection || !amount) {
      throw new BadRequestException('walletAddress, fixtureId, market, selection, amount are required');
    }
    if (!Object.values(MarketType).includes(market)) {
      throw new BadRequestException(`unknown market type: ${market}`);
    }
    assertWalletOwner(user, walletAddress);
    try {
      new PublicKey(walletAddress);
    } catch {
      throw new BadRequestException('walletAddress is not a valid Solana public key');
    }
    return this.bets.buildPlacePosition({
      walletAddress,
      fixtureId,
      market,
      selection,
      amount,
      oddsBps: body.oddsBps,
    });
  }
}
