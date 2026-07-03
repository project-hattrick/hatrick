import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

/**
 * Verify that `signatureBase64` is a valid ed25519 signature of `message`,
 * produced by the private key behind `walletAddress` (base58). This is the proof
 * of wallet ownership on sign-in. Pure + framework-free; returns false on any
 * malformed input rather than throwing.
 */
export function verifyWalletSignature(
  message: string,
  signatureBase64: string,
  walletAddress: string,
): boolean {
  try {
    const publicKey = new PublicKey(walletAddress).toBytes();
    const signature = Uint8Array.from(Buffer.from(signatureBase64, 'base64'));
    const encoded = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(encoded, signature, publicKey);
  } catch {
    return false;
  }
}
