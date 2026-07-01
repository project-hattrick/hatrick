import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { Connection } from '@solana/web3.js';

import { ChainConfig } from './chain.config';

/**
 * Owns the RPC connection and gates chain features behind SOLANA_ENABLED so the
 * app boots without a validator or secrets (mirrors TxlineIngestService).
 */
@Injectable()
export class SolanaService implements OnModuleInit {
  private readonly logger = new Logger(SolanaService.name);
  private conn: Connection | null = null;

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

  ensureEnabled(): void {
    if (!this.cfg.enabled) {
      throw new ServiceUnavailableException('Solana features are disabled (SOLANA_ENABLED!=true).');
    }
  }
}
