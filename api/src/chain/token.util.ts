import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

/**
 * Pure SPL helpers for the play token. Kept free of Nest DI so the faucet's
 * real token operations can be exercised directly (scripts/verify-faucet.cjs)
 * without booting the app.
 */

/** Create the fictitious play-token mint, held by `authority`. */
export function createPlayMint(
  connection: Connection,
  authority: Keypair,
  decimals: number,
): Promise<PublicKey> {
  return createMint(connection, authority, authority.publicKey, null, decimals);
}

/** Mint `rawAmount` base units of `mint` to `recipient`'s ATA; returns the tx signature. */
export async function airdropTokens(
  connection: Connection,
  authority: Keypair,
  mint: PublicKey,
  recipient: PublicKey,
  rawAmount: bigint,
): Promise<string> {
  const ata = await getOrCreateAssociatedTokenAccount(connection, authority, mint, recipient);
  return mintTo(connection, authority, mint, ata.address, authority, rawAmount);
}
