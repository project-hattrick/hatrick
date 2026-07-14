import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import { ChainConfig } from '../chain.config';
import { HatTrickClient, MarketAccount } from '../hat-trick.client';
import { HatTrickFantasyClient, DuelStateAccount } from '../clients/fantasy.client';
import { HatTrickPacksClient, CategoryVaultAccount, PackRequestAccount } from '../clients/packs.client';
import { ProvablyFairClient, SeedRecordAccount } from '../clients/provably-fair.client';

/**
 * Owns the RPC connection and gates chain features behind SOLANA_ENABLED so the
 * app boots without a validator or secrets (mirrors TxlineIngestService).
 * Exposes one vendored client per Anchor program.
 */
@Injectable()
export class SolanaService implements OnModuleInit {
  private readonly logger = new Logger(SolanaService.name);
  private conn: Connection | null = null;
  private hatTrick: HatTrickClient | null = null;
  private fantasy: HatTrickFantasyClient | null = null;
  private packs: HatTrickPacksClient | null = null;
  private provablyFair: ProvablyFairClient | null = null;

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
    if (!this.hatTrick) this.hatTrick = new HatTrickClient(this.cfg.bettingProgramId);
    return this.hatTrick;
  }

  get fantasyClient(): HatTrickFantasyClient {
    if (!this.fantasy) this.fantasy = new HatTrickFantasyClient(this.cfg.fantasyProgramId);
    return this.fantasy;
  }

  get packsClient(): HatTrickPacksClient {
    if (!this.packs)
      this.packs = new HatTrickPacksClient(this.cfg.packsProgramId, this.cfg.mplCoreProgramId);
    return this.packs;
  }

  get provablyFairClient(): ProvablyFairClient {
    if (!this.provablyFair)
      this.provablyFair = new ProvablyFairClient(this.cfg.provablyFairProgramId);
    return this.provablyFair;
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

  /** Assemble an unsigned transaction (recent blockhash + fee payer) as base64. */
  async buildUnsigned(ixs: TransactionInstruction[], feePayer: PublicKey): Promise<string> {
    const tx = new Transaction().add(...ixs);
    tx.feePayer = feePayer;
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    return tx.serialize({ requireAllSignatures: false }).toString('base64');
  }

  /** Fetch and decode a betting Market account, or null if it doesn't exist. */
  async getMarket(marketId: Buffer): Promise<MarketAccount | null> {
    const info = await this.connection.getAccountInfo(this.client.marketPda(marketId));
    return info ? HatTrickClient.decodeMarket(info.data) : null;
  }

  /** Fetch and decode a fantasy DuelState account, or null. */
  async getDuel(duelId: string): Promise<DuelStateAccount | null> {
    const info = await this.connection.getAccountInfo(this.fantasyClient.duelStatePda(duelId));
    return info ? HatTrickFantasyClient.decodeDuelState(info.data) : null;
  }

  /** Fetch and decode a provably-fair SeedRecord account, or null. */
  async getSeedRecord(recordId: string): Promise<SeedRecordAccount | null> {
    const info = await this.connection.getAccountInfo(
      this.provablyFairClient.seedRecordPda(recordId),
    );
    return info ? ProvablyFairClient.decodeSeedRecord(info.data) : null;
  }

  /** Fetch and decode a packs CategoryVault account, or null. */
  async getCategoryVault(templateId: string, category: string): Promise<CategoryVaultAccount | null> {
    const info = await this.connection.getAccountInfo(
      this.packsClient.categoryVaultPda(templateId, category),
    );
    return info ? HatTrickPacksClient.decodeCategoryVault(info.data) : null;
  }

  /** Fetch and decode a packs PackRequest account, or null. */
  async getPackRequest(user: PublicKey, packMint: PublicKey): Promise<PackRequestAccount | null> {
    const info = await this.connection.getAccountInfo(
      this.packsClient.packRequestPda(user, packMint),
    );
    return info ? HatTrickPacksClient.decodePackRequest(info.data) : null;
  }
}
