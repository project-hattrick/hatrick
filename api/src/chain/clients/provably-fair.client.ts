/**
 * Vendored client for the `hattrick_provably_fair` program (raw web3.js, no IDL).
 * Mirrors `project/contracts/programs/hattrick_provably_fair/src/*`.
 *
 * Commit-reveal oracle for fantasy duels and pack opens. The backend layer
 * keypair is the sole authority (it signs commit/reveal/close). The SeedRecord
 * PDA `[b"seed_record", record_id]` is read by the fantasy/packs programs to gate
 * settlement/fulfillment on `is_revealed`.
 */
import { createHash } from 'node:crypto';
import { Keypair, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';

import { Cursor, disc, meta, str } from './encoding';

const SEED_RECORD = Buffer.from('seed_record');

export interface SeedRecordAccount {
  recordId: string;
  serverSeedHash: Buffer;
  serverSeed: Buffer;
  replayJsonHash: Buffer;
  isRevealed: boolean;
  layer: PublicKey;
  bump: number;
}

/** SHA-256, the hash the on-chain `reveal_seed` recomputes over `server_seed`. */
export const sha256 = (data: Buffer): Buffer => createHash('sha256').update(data).digest();

export class ProvablyFairClient {
  constructor(private readonly programId: PublicKey) {}

  seedRecordPda(recordId: string): PublicKey {
    return PublicKey.findProgramAddressSync(
      [SEED_RECORD, Buffer.from(recordId, 'utf8')],
      this.programId,
    )[0];
  }

  /** commit_seed(record_id, server_seed_hash) — fantasy duel commit. */
  buildCommitSeed(params: {
    layer: PublicKey;
    recordId: string;
    serverSeedHash: Buffer;
  }): TransactionInstruction {
    return this.commit('commit_seed', params);
  }

  /** commit_seed_pack(record_id, server_seed_hash) — pack-open commit (no duel cross-check). */
  buildCommitSeedPack(params: {
    layer: PublicKey;
    recordId: string;
    serverSeedHash: Buffer;
  }): TransactionInstruction {
    return this.commit('commit_seed_pack', params);
  }

  private commit(
    name: 'commit_seed' | 'commit_seed_pack',
    params: { layer: PublicKey; recordId: string; serverSeedHash: Buffer },
  ): TransactionInstruction {
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.layer, true, true),
        meta(this.seedRecordPda(params.recordId), false, true),
        meta(SystemProgram.programId, false, false),
      ],
      data: Buffer.concat([disc(name), str(params.recordId), params.serverSeedHash]),
    });
  }

  /** reveal_seed(record_id, server_seed, replay_json_hash). */
  buildRevealSeed(params: {
    layer: PublicKey;
    recordId: string;
    serverSeed: Buffer;
    replayJsonHash: Buffer;
  }): TransactionInstruction {
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.layer, true, true),
        meta(this.seedRecordPda(params.recordId), false, true),
      ],
      data: Buffer.concat([
        disc('reveal_seed'),
        str(params.recordId),
        params.serverSeed,
        params.replayJsonHash,
      ]),
    });
  }

  /** close_record(record_id) — reclaims rent after reveal. */
  buildCloseRecord(params: { layer: PublicKey; recordId: string }): TransactionInstruction {
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.layer, true, true),
        meta(this.seedRecordPda(params.recordId), false, true),
      ],
      data: Buffer.concat([disc('close_record'), str(params.recordId)]),
    });
  }

  static decodeSeedRecord(data: Buffer): SeedRecordAccount {
    const c = new Cursor(data);
    return {
      recordId: c.str(),
      serverSeedHash: c.bytes(32),
      serverSeed: c.bytes(32),
      replayJsonHash: c.bytes(32),
      isRevealed: c.bool(),
      layer: c.pubkey(),
      bump: c.u8(),
    };
  }
}
