/**
 * Verifies B3–B5 on-chain against a local validator with the hat_trick program
 * loaded, using the COMPILED vendored client (dist/chain/hat-trick.client):
 *   B4 initialize_market → B5 place_position x2 (incl. serialize→wallet-sign)
 *   → decodeMarket → B3 keeper settle → claim.
 *
 *   solana-test-validator --reset --bpf-program 6pW64...J ../contracts/target/deploy/hat_trick.so
 *   npm run build && node scripts/verify-chain.cjs
 */
const {
  Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const {
  createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount, getAssociatedTokenAddressSync,
} = require('@solana/spl-token');
const { HatTrickClient, selectionHash, MarketKind, MarketStatus } = require('../dist/chain/hat-trick.client');

const PROGRAM_ID = new PublicKey('6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J');
const RPC = 'http://127.0.0.1:8899';
const FIXTURE = 12345;
const assert = (c, m) => { if (!c) throw new Error('ASSERT FAILED: ' + m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

async function send(conn, ixs, signers) {
  try {
    return await sendAndConfirmTransaction(conn, new Transaction().add(...ixs), signers, { commitment: 'confirmed' });
  } catch (e) {
    if (e.logs) console.error('  logs:\n   ' + e.logs.join('\n   '));
    throw e;
  }
}
async function fund(conn, payer, mint, owner, amount) {
  const ata = await getOrCreateAssociatedTokenAccount(conn, payer, mint, owner);
  await mintTo(conn, payer, mint, ata.address, payer, amount);
  return ata.address;
}

async function main() {
  const conn = new Connection(RPC, 'confirmed');
  const client = new HatTrickClient(PROGRAM_ID);
  const [payer, authority, oracle, winner, loser] = Array.from({ length: 5 }, () => Keypair.generate());
  for (const kp of [payer, authority, oracle, winner, loser]) {
    await conn.confirmTransaction(await conn.requestAirdrop(kp.publicKey, 100 * LAMPORTS_PER_SOL));
  }
  const mint = await createMint(conn, payer, payer.publicKey, null, 0);

  const marketId = HatTrickClient.deriveMarketId(FIXTURE, 'MatchResult');
  const HOME = selectionHash('Home');
  const AWAY = selectionHash('Away');
  const marketPda = client.marketPda(marketId);
  const closeTs = Math.floor(Date.now() / 1000) + 3;

  // B4 — open the market (server authority signs)
  await send(conn, [client.buildInitializeMarket({
    authority: authority.publicKey, mint, marketId, kind: MarketKind.LiveMatch,
    oracle: oracle.publicKey, closeTs, voidDelay: 3,
  })], [authority]);
  console.log(`✓ B4 initialize_market (fixture ${FIXTURE}, MatchResult)`);

  // B5 — winner bets Home (direct); loser bets Away via the serialize→sign path
  await fund(conn, payer, mint, winner.publicKey, 300);
  await send(conn, [client.buildPlacePosition({ bettor: winner.publicKey, mint, marketId, selection: HOME, amount: 300, oddsBps: 0 })], [winner]);

  await fund(conn, payer, mint, loser.publicKey, 100);
  const ix = client.buildPlacePosition({ bettor: loser.publicKey, mint, marketId, selection: AWAY, amount: 100, oddsBps: 0 });
  const unsigned = new Transaction().add(ix);
  unsigned.feePayer = loser.publicKey;
  unsigned.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
  const b64 = unsigned.serialize({ requireAllSignatures: false }).toString('base64'); // what BetService returns
  const rebuilt = Transaction.from(Buffer.from(b64, 'base64'));
  rebuilt.sign(loser);
  await conn.confirmTransaction(await conn.sendRawTransaction(rebuilt.serialize()));
  console.log('✓ B5 place_position x2 (incl. serialized-unsigned → wallet-signed)');

  // decodeMarket (custom borsh reader)
  let market = HatTrickClient.decodeMarket((await conn.getAccountInfo(marketPda)).data);
  assert(market.totalPool === 400n, `totalPool 400, got ${market.totalPool}`);
  console.log(`✓ decodeMarket → totalPool ${market.totalPool}`);

  // B3 — keeper settle to Home (reads close_ts from chain, signs with oracle)
  const ixs = client.buildSettle({ settler: oracle.publicKey, oracle, marketId, selection: HOME, closeTs: market.closeTs });
  let settled = false;
  for (let i = 0; i < 20 && !settled; i++) {
    try { await send(conn, ixs, [oracle]); settled = true; } catch { await sleep(1000); }
  }
  assert(settled, 'keeper settle should succeed after close_ts');
  market = HatTrickClient.decodeMarket((await conn.getAccountInfo(marketPda)).data);
  assert(market.status === MarketStatus.Settled, 'status Settled');
  assert(market.winningPool === 300n, `winningPool 300, got ${market.winningPool}`);
  console.log(`✓ B3 keeper settle → Settled, winningPool ${market.winningPool}`);

  // claim — winner takes the pool
  await send(conn, [client.buildClaim({ winner: winner.publicKey, mint, marketId, winningSelection: HOME })], [winner]);
  const bal = await getAccount(conn, getAssociatedTokenAddressSync(mint, winner.publicKey));
  assert(Number(bal.amount) === 400, `winner should hold 400, got ${bal.amount}`);
  console.log(`✓ claim → winner paid ${bal.amount}`);

  console.log('\nCHAIN VERIFY (B3–B5) PASSED ✅');
}
main().then(() => process.exit(0)).catch((e) => { console.error('\n❌ ' + e.message); process.exit(1); });
