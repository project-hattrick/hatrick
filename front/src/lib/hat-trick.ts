import { PublicKey } from '@solana/web3.js';
import { keccak_256 } from 'js-sha3';

import { MarketType } from '@/enums';
import { env } from './env';

/**
 * Minimal browser-side client for the hat_trick program — PDA derivation, a
 * Market account decoder, and selection hashing. Vendored (front is its own app,
 * no cross-app import); layout mirrors contracts/state.rs and the api client.
 */
export const HAT_TRICK_PROGRAM_ID = new PublicKey(env.programId);

const te = new TextEncoder();

export enum MarketStatus {
  Open = 0,
  Settled = 1,
  Voided = 2,
}

/** Deterministic 16-byte market id: fixtureId (u32 LE) + MarketType index. */
export function deriveMarketId(fixtureId: number, market: MarketType): Uint8Array {
  const id = new Uint8Array(16);
  new DataView(id.buffer).setUint32(0, fixtureId, true);
  id[4] = Object.values(MarketType).indexOf(market);
  return id;
}

export function marketPda(marketId: Uint8Array): PublicKey {
  return PublicKey.findProgramAddressSync([te.encode('market'), marketId], HAT_TRICK_PROGRAM_ID)[0];
}

/** keccak256 of a human selection ("Home" | "Over2.5" | a playerId). */
export const selectionHash = (selection: string): Uint8Array =>
  new Uint8Array(keccak_256.arrayBuffer(selection));

export interface DecodedMarket {
  status: MarketStatus;
  totalPool: bigint;
  winningPool: bigint;
  winningSelection: Uint8Array;
  merkleRoot: Uint8Array;
  resultHash: Uint8Array;
  closeTs: bigint;
}

/** Decode the fields the proof panel needs (offsets mirror contracts state.rs). */
export function decodeMarket(data: Uint8Array): DecodedMarket {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    status: data[121] as MarketStatus,
    totalPool: dv.getBigUint64(122, true),
    winningPool: dv.getBigUint64(130, true),
    winningSelection: data.slice(138, 170),
    merkleRoot: data.slice(170, 202),
    resultHash: data.slice(202, 234),
    closeTs: dv.getBigInt64(234, true),
  };
}

export const toHex = (b: Uint8Array): string =>
  Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');

const eq = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/** Reverse a 1X2 selection hash back to its label, or null if not a 1X2 outcome. */
export function outcomeLabel(selection: Uint8Array): string | null {
  for (const o of ['Home', 'Draw', 'Away']) {
    if (eq(selection, selectionHash(o))) return o;
  }
  return null;
}
