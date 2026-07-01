/**
 * Verifies the faucet's real token operations (the COMPILED chain/token.util)
 * against a local validator — no Nest boot / Postgres needed.
 *
 *   solana-test-validator --reset
 *   npm run build && node scripts/verify-faucet.cjs
 */
const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getAssociatedTokenAddress, getAccount } = require('@solana/spl-token');
const { createPlayMint, airdropTokens } = require('../dist/chain/token.util');

const RPC = 'http://127.0.0.1:8899';
const DECIMALS = 6;
const AMOUNT = 1000;

async function main() {
  const conn = new Connection(RPC, 'confirmed');
  const authority = Keypair.generate();
  const recipient = Keypair.generate();
  await conn.confirmTransaction(await conn.requestAirdrop(authority.publicKey, 5 * LAMPORTS_PER_SOL));

  const mint = await createPlayMint(conn, authority, DECIMALS);
  console.log('✓ createPlayMint →', mint.toBase58());

  const raw = BigInt(AMOUNT) * 10n ** BigInt(DECIMALS);
  const sig = await airdropTokens(conn, authority, mint, recipient.publicKey, raw);
  console.log('✓ airdropTokens →', sig);

  const ata = await getAssociatedTokenAddress(mint, recipient.publicKey);
  const bal = await getAccount(conn, ata);
  if (BigInt(bal.amount) !== raw) throw new Error(`expected ${raw} base units, got ${bal.amount}`);
  console.log(`✓ recipient balance = ${AMOUNT} play tokens (${bal.amount} base units)`);

  // second grant to the same wallet must top up the existing ATA (idempotent)
  await airdropTokens(conn, authority, mint, recipient.publicKey, raw);
  const bal2 = await getAccount(conn, ata);
  if (BigInt(bal2.amount) !== raw * 2n) throw new Error(`expected ${raw * 2n}, got ${bal2.amount}`);
  console.log('✓ repeat grant tops up existing ATA');

  console.log('\nFAUCET VERIFY PASSED ✅');
}
main().then(() => process.exit(0)).catch((e) => { console.error('\n❌ ' + e.message); process.exit(1); });
