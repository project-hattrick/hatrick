import * as anchor from '@coral-xyz/anchor';
import * as crypto from 'crypto';
import { assert } from 'chai';

describe('hattrick_provably_fair', () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  it('commits a seed hash', async () => {
    // TODO: commit_seed with SHA-256 hash, assert seed_record created
    assert.ok(true, 'placeholder');
  });

  it('reveals the seed and verifies hash on-chain', async () => {
    const serverSeed = crypto.randomBytes(32);
    const hash = crypto.createHash('sha256').update(serverSeed).digest();
    // TODO: commit hash, then reveal_seed, assert is_revealed = true
    assert.ok(hash.length === 32, 'hash must be 32 bytes');
  });

  it('rejects reveal with wrong seed', async () => {
    // TODO: commit hash, try to reveal wrong seed, expect SeedHashMismatch error
    assert.ok(true, 'placeholder');
  });
});
