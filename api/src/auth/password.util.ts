import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

/**
 * Password hashing with node:crypto scrypt — no native-module dependency.
 * Async (libuv thread pool) so hashing never blocks the event loop.
 * Stored format: `scrypt$<saltHex>$<hashHex>`.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const FORMAT_PREFIX = 'scrypt';

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(plain, salt, KEY_LENGTH)).toString('hex');
  return `${FORMAT_PREFIX}$${salt}$${hash}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [prefix, salt, hash] = stored.split('$');
  if (prefix !== FORMAT_PREFIX || !salt || !hash) return false;
  const candidate = await scryptAsync(plain, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Placeholder base58-style address for wallet-less (Collector) accounts —
 * `users.walletAddress` is NOT NULL and the front renders it everywhere a
 * wallet would appear. Never a valid on-curve key, so it can't sign anything.
 */
export function syntheticWalletAddress(): string {
  const bytes = randomBytes(44);
  return Array.from(bytes, (b) => BASE58[b % BASE58.length]).join('');
}
