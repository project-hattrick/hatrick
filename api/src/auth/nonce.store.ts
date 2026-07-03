import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes to sign after requesting

interface NonceEntry {
  nonce: string;
  expiresAt: number;
}

/**
 * Short-lived, single-use sign-in nonces keyed by wallet address. In-memory is
 * fine for the hackathon (single api instance); swap for Redis if we scale out.
 */
@Injectable()
export class NonceStore {
  private readonly entries = new Map<string, NonceEntry>();

  /** Issue (and store) a fresh nonce for a wallet, replacing any previous one. */
  issue(walletAddress: string): string {
    this.sweep();
    const nonce = randomBytes(32).toString('hex');
    this.entries.set(walletAddress, {
      nonce,
      expiresAt: Date.now() + NONCE_TTL_MS,
    });
    return nonce;
  }

  /** Return and invalidate the wallet's nonce, or null if missing/expired. */
  consume(walletAddress: string): string | null {
    const entry = this.entries.get(walletAddress);
    this.entries.delete(walletAddress);
    if (!entry || entry.expiresAt < Date.now()) return null;
    return entry.nonce;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt < now) this.entries.delete(key);
    }
  }
}
