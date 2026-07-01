/**
 * Vendored client for the `hat_trick` Anchor program — raw web3.js (Anchor
 * discriminators + borsh), no import from contracts/ (independent-app rule) and
 * no Anchor CLI/IDL dependency. Mirrors the encoding proven in
 * contracts/scripts/e2e.cjs. Pure (no Nest DI) so it's verifiable standalone.
 */
import { createHash } from 'node:crypto';
import {
  Ed25519Program,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { keccak_256 } from 'js-sha3';

import { MarketType } from '../events/enums/market-type.enum';

/** On-chain MarketKind discriminants (order matches contracts state.rs). */
export enum MarketKind {
  LiveMatch = 0,
  Fantasy1v1 = 1,
}

/** On-chain MarketStatus discriminants (order matches contracts state.rs). */
export enum MarketStatus {
  Open = 0,
  Settled = 1,
  Voided = 2,
}

export interface MarketAccount {
  authority: PublicKey;
  oracle: PublicKey;
  mint: PublicKey;
  marketId: Buffer;
  kind: MarketKind;
  status: MarketStatus;
  totalPool: bigint;
  winningPool: bigint;
  winningSelection: Buffer;
  merkleRoot: Buffer;
  resultHash: Buffer;
  closeTs: bigint;
  voidDelay: bigint;
}

const disc = (name: string): Buffer =>
  createHash('sha256').update(`global:${name}`).digest().subarray(0, 8);
const u64 = (n: bigint | number): Buffer => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
};
const i64 = (n: bigint | number): Buffer => {
  const b = Buffer.alloc(8);
  b.writeBigInt64LE(BigInt(n));
  return b;
};
const u32 = (n: number): Buffer => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
const meta = (pubkey: PublicKey, isSigner: boolean, isWritable: boolean) => ({
  pubkey,
  isSigner,
  isWritable,
});

/** keccak256 of a human selection ("Home" | "Over2.5" | a playerId). */
export const selectionHash = (selection: string): Buffer =>
  Buffer.from(keccak_256.arrayBuffer(selection));

export class HatTrickClient {
  constructor(private readonly programId: PublicKey) {}

  private pda(seeds: Buffer[]): PublicKey {
    return PublicKey.findProgramAddressSync(seeds, this.programId)[0];
  }

  /** Deterministic 16-byte market id: fixtureId (u32 LE) + MarketType index. */
  static deriveMarketId(fixtureId: number, market: MarketType): Buffer {
    const id = Buffer.alloc(16);
    id.writeUInt32LE(fixtureId, 0);
    id.writeUInt8(Object.values(MarketType).indexOf(market), 4);
    return id;
  }

  marketPda = (marketId: Buffer): PublicKey => this.pda([Buffer.from('market'), marketId]);
  vaultPda = (market: PublicKey): PublicKey => this.pda([Buffer.from('vault'), market.toBuffer()]);
  poolPda = (market: PublicKey, selection: Buffer): PublicKey =>
    this.pda([Buffer.from('pool'), market.toBuffer(), selection]);
  positionPda = (market: PublicKey, owner: PublicKey, selection: Buffer): PublicKey =>
    this.pda([Buffer.from('position'), market.toBuffer(), owner.toBuffer(), selection]);

  /** market_id || winning_selection || merkle_root || close_ts (what the oracle signs). */
  static settlementMessage(marketId: Buffer, selection: Buffer, merkleRoot: Buffer, closeTs: bigint): Buffer {
    return Buffer.concat([marketId, selection, merkleRoot, i64(closeTs)]);
  }

  /** keccak(market_id || winning_selection || close_ts) — the TxLINE result leaf. */
  static resultLeaf(marketId: Buffer, selection: Buffer, closeTs: bigint): Buffer {
    return Buffer.from(keccak_256.arrayBuffer(Buffer.concat([marketId, selection, i64(closeTs)])));
  }

  buildInitializeMarket(params: {
    authority: PublicKey;
    mint: PublicKey;
    marketId: Buffer;
    kind: MarketKind;
    oracle: PublicKey;
    closeTs: bigint | number;
    voidDelay: bigint | number;
  }): TransactionInstruction {
    const market = this.marketPda(params.marketId);
    const vault = this.vaultPda(market);
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.authority, true, true),
        meta(market, false, true),
        meta(params.mint, false, false),
        meta(vault, false, true),
        meta(TOKEN_PROGRAM_ID, false, false),
        meta(SystemProgram.programId, false, false),
        meta(SYSVAR_RENT_PUBKEY, false, false),
      ],
      data: Buffer.concat([
        disc('initialize_market'),
        params.marketId,
        Buffer.from([params.kind]),
        params.oracle.toBuffer(),
        i64(params.closeTs),
        i64(params.voidDelay),
      ]),
    });
  }

  buildPlacePosition(params: {
    bettor: PublicKey;
    mint: PublicKey;
    marketId: Buffer;
    selection: Buffer;
    amount: bigint | number;
    oddsBps: number;
  }): TransactionInstruction {
    const market = this.marketPda(params.marketId);
    const bettorToken = getAssociatedTokenAddressSync(params.mint, params.bettor);
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.bettor, true, true),
        meta(market, false, true),
        meta(this.vaultPda(market), false, true),
        meta(this.poolPda(market, params.selection), false, true),
        meta(this.positionPda(market, params.bettor, params.selection), false, true),
        meta(bettorToken, false, true),
        meta(TOKEN_PROGRAM_ID, false, false),
        meta(SystemProgram.programId, false, false),
      ],
      data: Buffer.concat([
        disc('place_position'),
        params.selection,
        u64(params.amount),
        u32(params.oddsBps),
      ]),
    });
  }

  /**
   * Settle instructions: [ed25519 verify, settle_market]. The oracle signs
   * `settlementMessage`; an empty proof means merkle_root == result leaf.
   */
  buildSettle(params: {
    settler: PublicKey;
    oracle: Keypair;
    marketId: Buffer;
    selection: Buffer;
    closeTs: bigint;
    merkleRoot?: Buffer;
    merkleProof?: Buffer[];
  }): TransactionInstruction[] {
    const market = this.marketPda(params.marketId);
    const merkleRoot =
      params.merkleRoot ?? HatTrickClient.resultLeaf(params.marketId, params.selection, params.closeTs);
    const proof = params.merkleProof ?? [];
    const message = HatTrickClient.settlementMessage(params.marketId, params.selection, merkleRoot, params.closeTs);

    const edIx = Ed25519Program.createInstructionWithPrivateKey({
      privateKey: params.oracle.secretKey,
      message,
    });
    const settleIx = new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.settler, true, true),
        meta(market, false, true),
        meta(this.poolPda(market, params.selection), false, false),
        meta(SYSVAR_INSTRUCTIONS_PUBKEY, false, false),
      ],
      data: Buffer.concat([
        disc('settle_market'),
        params.selection,
        merkleRoot,
        u32(proof.length),
        ...proof,
      ]),
    });
    return [edIx, settleIx];
  }

  buildClaim(params: {
    winner: PublicKey;
    mint: PublicKey;
    marketId: Buffer;
    winningSelection: Buffer;
  }): TransactionInstruction {
    const market = this.marketPda(params.marketId);
    const winnerToken = getAssociatedTokenAddressSync(params.mint, params.winner);
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.winner, true, true),
        meta(market, false, false),
        meta(this.poolPda(market, params.winningSelection), false, false),
        meta(this.positionPda(market, params.winner, params.winningSelection), false, true),
        meta(this.vaultPda(market), false, true),
        meta(winnerToken, false, true),
        meta(TOKEN_PROGRAM_ID, false, false),
      ],
      data: disc('claim'),
    });
  }

  /** Decode a Market account (layout mirrors contracts state.rs). */
  static decodeMarket(data: Buffer): MarketAccount {
    let o = 8; // skip anchor discriminator
    const pk = (): PublicKey => {
      const k = new PublicKey(data.subarray(o, o + 32));
      o += 32;
      return k;
    };
    const bytes = (n: number): Buffer => {
      const b = Buffer.from(data.subarray(o, o + n));
      o += n;
      return b;
    };
    const authority = pk();
    const oracle = pk();
    const mint = pk();
    const marketId = bytes(16);
    const kind = data.readUInt8(o++) as MarketKind;
    const status = data.readUInt8(o++) as MarketStatus;
    const totalPool = data.readBigUInt64LE(o);
    o += 8;
    const winningPool = data.readBigUInt64LE(o);
    o += 8;
    const winningSelection = bytes(32);
    const merkleRoot = bytes(32);
    const resultHash = bytes(32);
    const closeTs = data.readBigInt64LE(o);
    o += 8;
    const voidDelay = data.readBigInt64LE(o);
    o += 8;
    return {
      authority,
      oracle,
      mint,
      marketId,
      kind,
      status,
      totalPool,
      winningPool,
      winningSelection,
      merkleRoot,
      resultHash,
      closeTs,
      voidDelay,
    };
  }
}
