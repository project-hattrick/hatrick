import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SeedCommitContext } from '@prisma/client';
import { randomBytes, createHash } from 'node:crypto';

import { ChainConfig } from '../chain.config';
import { SolanaService } from './solana.service';
import { SeedCommitRepository } from '../repositories/seed-commit.repository';
import { sha256 } from '../clients/provably-fair.client';

/**
 * Provably-fair layer: generate → commit → reveal → (optional) close.
 *
 * The 32-byte `serverSeed` is generated here and persisted (hex) in
 * `SeedCommit`. Only the SHA-256 hash is put on-chain at commit time, so
 * the outcome is unpredictable to the user until reveal.
 *
 * All methods early-return when SOLANA_ENABLED=false so the app boots
 * cleanly without a validator.
 */
@Injectable()
export class ProvablyFairService {
  private readonly logger = new Logger(ProvablyFairService.name);

  constructor(
    private readonly cfg: ChainConfig,
    private readonly solana: SolanaService,
    private readonly repo: SeedCommitRepository,
  ) {}

  /**
   * Generate a server seed, store it, and submit `commit_seed` (duel variant).
   * @returns the recordId that was committed.
   */
  async commit(recordId: string, context: SeedCommitContext): Promise<string> {
    if (!this.cfg.enabled) {
      this.logger.debug(`chain disabled — skipping commit for ${recordId}`);
      await this.repo.create({ recordId, serverSeed: randomBytes(32).toString('hex'), context });
      return recordId;
    }

    const serverSeedBuf = randomBytes(32);
    const serverSeedHex = serverSeedBuf.toString('hex');
    const hashBuf = sha256(serverSeedBuf);

    const layer = this.cfg.layer();
    const pf = this.solana.provablyFairClient;

    const ix =
      context === SeedCommitContext.Pack
        ? pf.buildCommitSeedPack({ layer: layer.publicKey, recordId, serverSeedHash: hashBuf })
        : pf.buildCommitSeed({ layer: layer.publicKey, recordId, serverSeedHash: hashBuf });

    const txSig = await this.solana.send([ix], [layer]);
    this.logger.log(`commit[${context}] recordId=${recordId} txSig=${txSig}`);

    await this.repo.create({ recordId, serverSeed: serverSeedHex, context, txSig });
    return recordId;
  }

  /**
   * Reveal the server seed on-chain. `replayJsonHash` is a 32-byte hash of
   * whatever the caller wants to bind to the record (e.g. duel replay JSON).
   * Pass 32 zero bytes when no replay is available.
   */
  async reveal(recordId: string, replayJsonHash?: Buffer): Promise<string> {
    const commit = await this.repo.findById(recordId);
    if (!commit) throw new NotFoundException(`SeedCommit not found: ${recordId}`);
    if (commit.revealed) {
      this.logger.warn(`reveal called on already-revealed record ${recordId} — noop`);
      return commit.txSig ?? '';
    }

    if (!this.cfg.enabled) {
      this.logger.debug(`chain disabled — skipping reveal for ${recordId}`);
      await this.repo.markRevealed(recordId, 'mock-reveal');
      return 'mock-reveal';
    }

    const serverSeedBuf = Buffer.from(commit.serverSeed, 'hex');
    const hashBuf = replayJsonHash ?? Buffer.alloc(32);

    const layer = this.cfg.layer();
    const ix = this.solana.provablyFairClient.buildRevealSeed({
      layer: layer.publicKey,
      recordId,
      serverSeed: serverSeedBuf,
      replayJsonHash: hashBuf,
    });

    const txSig = await this.solana.send([ix], [layer]);
    this.logger.log(`reveal recordId=${recordId} txSig=${txSig}`);
    await this.repo.markRevealed(recordId, txSig);
    return txSig;
  }

  /**
   * Close the on-chain SeedRecord to reclaim rent. Best-effort; does not
   * throw if the record is already gone.
   */
  async close(recordId: string): Promise<void> {
    if (!this.cfg.enabled) return;
    try {
      const layer = this.cfg.layer();
      const ix = this.solana.provablyFairClient.buildCloseRecord({
        layer: layer.publicKey,
        recordId,
      });
      const sig = await this.solana.send([ix], [layer]);
      this.logger.log(`close_record ${recordId} txSig=${sig}`);
    } catch (err) {
      this.logger.warn(`close_record ${recordId} failed (best-effort): ${String(err)}`);
    }
  }

  /**
   * Retrieve the stored server seed so callers can replay the RNG
   * deterministically (pack fulfillment card selection mirror).
   */
  async getServerSeed(recordId: string): Promise<Buffer> {
    const commit = await this.repo.findById(recordId);
    if (!commit) throw new NotFoundException(`SeedCommit not found: ${recordId}`);
    return Buffer.from(commit.serverSeed, 'hex');
  }
}
