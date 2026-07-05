import { Injectable, Logger } from '@nestjs/common';
import { Keypair, PublicKey } from '@solana/web3.js';

import { ChainConfig } from '../chain.config';
import { SolanaService } from './solana.service';
import { airdropTokens, createPlayMint } from '../token.util';

export interface FaucetGrant {
  mint: string;
  amount: number;
  signature: string;
}

/**
 * Devnet play-token faucet — grants fictitious tokens so users can place bets.
 * No real money moves (see compliance). The mint is resolved once: use the
 * configured PLAY_TOKEN_MINT, or create one on first use in dev.
 */
@Injectable()
export class FaucetService {
  private readonly logger = new Logger(FaucetService.name);
  private mint: PublicKey | null = null;

  constructor(
    private readonly solana: SolanaService,
    private readonly cfg: ChainConfig,
  ) {}

  async airdrop(walletAddress: string): Promise<FaucetGrant> {
    this.solana.ensureEnabled();
    const recipient = new PublicKey(walletAddress);
    const authority = this.cfg.mintAuthority();
    const mint = await this.resolveMint(authority);

    const raw = BigInt(this.cfg.faucetAmount) * 10n ** BigInt(this.cfg.playTokenDecimals);
    const signature = await airdropTokens(this.solana.connection, authority, mint, recipient, raw);

    this.logger.log(`faucet: ${this.cfg.faucetAmount} tokens → ${walletAddress} (${signature})`);
    return { mint: mint.toBase58(), amount: this.cfg.faucetAmount, signature };
  }

  private async resolveMint(authority: Keypair): Promise<PublicKey> {
    if (this.mint) return this.mint;

    const configured = this.cfg.playTokenMint();
    if (configured) {
      this.mint = configured;
      return configured;
    }

    this.mint = await createPlayMint(this.solana.connection, authority, this.cfg.playTokenDecimals);
    this.logger.warn(`PLAY_TOKEN_MINT unset — created dev mint ${this.mint.toBase58()}`);
    return this.mint;
  }
}
