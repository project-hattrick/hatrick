import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import {
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import { ChainConfig } from '../chain.config';
import { HatTrickClient, MarketAccount } from '../hat-trick.client';

/**
 * Owns the RPC connection and gates chain features behind SOLANA_ENABLED so the
 * app boots without a validator or secrets (mirrors TxlineIngestService).
 */
@Injectable()
export class SolanaService implements OnModuleInit {
  private readonly logger = new Logger(SolanaService.name);
  private conn: Connection | null = null;
  private hatTrick: HatTrickClient | null = null;

  constructor(private readonly cfg: ChainConfig) {}

  onModuleInit(): void {
    if (!this.cfg.enabled) {
      this.logger.warn('SOLANA_ENABLED!=true — chain features disabled (boot-safe).');
      return;
    }
    this.logger.log(
      `Solana ${this.cfg.cluster} · program ${this.cfg.programId.toBase58()} · rpc ${this.cfg.rpcUrl}`,
    );
  }

  get connection(): Connection {
    if (!this.conn) this.conn = new Connection(this.cfg.rpcUrl, 'confirmed');
    return this.conn;
  }

  get client(): HatTrickClient {
    if (!this.hatTrick) this.hatTrick = new HatTrickClient(this.cfg.programId);
    return this.hatTrick;
  }

  ensureEnabled(): void {
    if (!this.cfg.enabled) {
      throw new ServiceUnavailableException('Solana features are disabled (SOLANA_ENABLED!=true).');
    }
  }

  /** Sign, send and confirm a transaction of program instructions. */
  send(ixs: TransactionInstruction[], signers: Keypair[]): Promise<string> {
    return sendAndConfirmTransaction(this.connection, new Transaction().add(...ixs), signers, {
      commitment: 'confirmed',
    });
  }

  /** Fetch and decode a Market account, or null if it doesn't exist. */
  async getMarket(marketId: Buffer): Promise<MarketAccount | null> {
    const pda = this.client.marketPda(marketId);
    const info = await this.connection.getAccountInfo(pda);
    return info ? HatTrickClient.decodeMarket(info.data) : null;
  }
}
