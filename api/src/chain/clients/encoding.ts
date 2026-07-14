/**
 * Shared borsh/Anchor encoding primitives for the vendored program clients.
 *
 * We deliberately DON'T depend on @coral-xyz/anchor or the contracts' IDL
 * (independent-app rule + no CLI at build time): each client hand-encodes its
 * instructions with raw web3.js, exactly mirroring the Rust programs under
 * `project/contracts/programs/*`. Anchor's wire format is:
 *   - instruction data = sha256("global:<snake_name>")[:8] || borsh(args)
 *   - account data      = sha256("account:<Name>")[:8]    || borsh(fields)
 *   - String  = u32 LE length prefix || utf-8 bytes
 *   - Vec<T>  = u32 LE length prefix || each element
 *   - bool    = 1 byte (0/1)
 */
import { createHash } from 'node:crypto';
import { AccountMeta, PublicKey } from '@solana/web3.js';
import { keccak_256 } from 'js-sha3';

/** Anchor instruction discriminator: sha256("global:<name>")[:8]. */
export const disc = (name: string): Buffer =>
  createHash('sha256').update(`global:${name}`).digest().subarray(0, 8);

/** Anchor account discriminator: sha256("account:<Name>")[:8]. */
export const accountDisc = (name: string): Buffer =>
  createHash('sha256').update(`account:${name}`).digest().subarray(0, 8);

export const u8 = (n: number): Buffer => Buffer.from([n & 0xff]);

export const bool = (b: boolean): Buffer => Buffer.from([b ? 1 : 0]);

export const u16 = (n: number): Buffer => {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
};

export const u32 = (n: number): Buffer => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};

export const u64 = (n: bigint | number): Buffer => {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
};

export const i64 = (n: bigint | number): Buffer => {
  const b = Buffer.alloc(8);
  b.writeBigInt64LE(BigInt(n));
  return b;
};

/** Borsh String: u32 LE length prefix + utf-8 bytes. */
export const str = (s: string): Buffer => {
  const bytes = Buffer.from(s, 'utf8');
  return Buffer.concat([u32(bytes.length), bytes]);
};

/** Borsh Vec<T>: u32 LE length prefix + concatenated encoded elements. */
export const vec = <T>(items: T[], encode: (item: T) => Buffer): Buffer =>
  Buffer.concat([u32(items.length), ...items.map(encode)]);

export const meta = (pubkey: PublicKey, isSigner: boolean, isWritable: boolean): AccountMeta => ({
  pubkey,
  isSigner,
  isWritable,
});

/** keccak256 of a human selection string ("Home" | "Over2.5" | a playerId). */
export const selectionHash = (selection: string): Buffer =>
  Buffer.from(keccak_256.arrayBuffer(selection));

/** A tiny cursor for decoding account data (skips the 8-byte discriminator). */
export class Cursor {
  private o = 8;
  constructor(private readonly data: Buffer) {}
  pubkey(): PublicKey {
    const k = new PublicKey(this.data.subarray(this.o, this.o + 32));
    this.o += 32;
    return k;
  }
  bytes(n: number): Buffer {
    const b = Buffer.from(this.data.subarray(this.o, this.o + n));
    this.o += n;
    return b;
  }
  u8(): number {
    return this.data.readUInt8(this.o++);
  }
  bool(): boolean {
    return this.data.readUInt8(this.o++) === 1;
  }
  u16(): number {
    const v = this.data.readUInt16LE(this.o);
    this.o += 2;
    return v;
  }
  u32(): number {
    const v = this.data.readUInt32LE(this.o);
    this.o += 4;
    return v;
  }
  u64(): bigint {
    const v = this.data.readBigUInt64LE(this.o);
    this.o += 8;
    return v;
  }
  i64(): bigint {
    const v = this.data.readBigInt64LE(this.o);
    this.o += 8;
    return v;
  }
  str(): string {
    const len = this.u32();
    const s = this.data.subarray(this.o, this.o + len).toString('utf8');
    this.o += len;
    return s;
  }
}
