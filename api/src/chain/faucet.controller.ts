import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PublicKey } from '@solana/web3.js';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FaucetGrant, FaucetService } from './faucet.service';

interface FaucetRequestBody {
  walletAddress?: string;
}

@ApiTags('Faucet')
@Controller('faucet')
export class FaucetController {
  constructor(private readonly faucet: FaucetService) {}

  /** Grant devnet play tokens to the signed-in wallet (token is the source of truth). */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async request(
    @Body() body: FaucetRequestBody,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FaucetGrant> {
    if (body?.walletAddress && body.walletAddress !== user.walletAddress) {
      throw new ForbiddenException('walletAddress must match the signed-in wallet');
    }
    try {
      new PublicKey(user.walletAddress);
    } catch {
      throw new BadRequestException('signed-in wallet is not a valid Solana public key');
    }
    return this.faucet.airdrop(user.walletAddress);
  }
}
