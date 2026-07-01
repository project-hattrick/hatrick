import { Injectable } from '@nestjs/common';
import { PublicKey, Transaction } from '@solana/web3.js';

import { MarketType } from '../events/enums/market-type.enum';
import { ChainConfig } from './chain.config';
import { SolanaService } from './solana.service';
import { HatTrickClient, selectionHash } from './hat-trick.client';

export interface BuildBetInput {
  walletAddress: string;
  fixtureId: number;
  market: MarketType;
  selection: string;
  amount: number;
  oddsBps?: number;
}

/**
 * Builds an unsigned `place_position` transaction for the frontend wallet to
 * sign. Placing a bet moves the user's tokens, so it must be signed by the
 * user — the backend only assembles it (recent blockhash + fee payer).
 */
@Injectable()
export class BetService {
  constructor(
    private readonly solana: SolanaService,
    private readonly cfg: ChainConfig,
  ) {}

  async buildPlacePosition(input: BuildBetInput): Promise<{ transaction: string }> {
    this.solana.ensureEnabled();
    const mint = this.cfg.playTokenMint();
    if (!mint) throw new Error('PLAY_TOKEN_MINT must be set to place bets');

    const bettor = new PublicKey(input.walletAddress);
    const raw = BigInt(input.amount) * 10n ** BigInt(this.cfg.playTokenDecimals);
    const ix = this.solana.client.buildPlacePosition({
      bettor,
      mint,
      marketId: HatTrickClient.deriveMarketId(input.fixtureId, input.market),
      selection: selectionHash(input.selection),
      amount: raw,
      oddsBps: input.oddsBps ?? 0,
    });

    const tx = new Transaction().add(ix);
    tx.feePayer = bettor;
    tx.recentBlockhash = (await this.solana.connection.getLatestBlockhash()).blockhash;
    return { transaction: tx.serialize({ requireAllSignatures: false }).toString('base64') };
  }
}
