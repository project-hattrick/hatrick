import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PublicKey } from '@solana/web3.js';

import { FaucetGrant, FaucetService } from './faucet.service';

interface FaucetRequestBody {
  walletAddress?: string;
}

@ApiTags('Faucet')
@Controller('faucet')
export class FaucetController {
  constructor(private readonly faucet: FaucetService) {}

  /** Grant devnet play tokens to a wallet. */
  @Post()
  async request(@Body() body: FaucetRequestBody): Promise<FaucetGrant> {
    if (!body?.walletAddress) throw new BadRequestException('walletAddress is required');
    try {
      new PublicKey(body.walletAddress);
    } catch {
      throw new BadRequestException('walletAddress is not a valid Solana public key');
    }
    return this.faucet.airdrop(body.walletAddress);
  }
}
