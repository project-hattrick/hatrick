/**
 * Standalone e2e for the hat_trick program — no Anchor CLI / IDL required.
 * Loads the compiled .so into a local validator and drives the full lifecycle
 * with raw web3.js (manual Anchor discriminators + borsh), asserting on-chain
 * SPL balances: place(2 sides) → oracle-signed settle → winner claim, loser denied.
 *
 *   solana-test-validator --reset \
 *     --bpf-program 6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J target/deploy/hat_trick.so
 *   node scripts/e2e.cjs
 */
const crypto = require("crypto");
const {
  Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction,
  Ed25519Program, sendAndConfirmTransaction, SYSVAR_RENT_PUBKEY,
  SYSVAR_INSTRUCTIONS_PUBKEY, LAMPORTS_PER_SOL,
} = require("@solana/web3.js");
const {
  createMint, getOrCreateAssociatedTokenAccount, mintTo, getAccount, TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const { keccak_256 } = require("js-sha3");

const PROGRAM_ID = new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J");
const RPC = "http://127.0.0.1:8899";

// --- encoding helpers --------------------------------------------------------
const disc = (name) => crypto.createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
const keccak = (buf) => Buffer.from(keccak_256.arrayBuffer(buf));
const u64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; };
const i64 = (n) => { const b = Buffer.alloc(8); b.writeBigInt64LE(BigInt(n)); return b; };
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; };
const meta = (pubkey, isSigner, isWritable) => ({ pubkey, isSigner, isWritable });
const pda = (seeds) => PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];

const assert = (cond, msg) => { if (!cond) { throw new Error("ASSERT FAILED: " + msg); } };
const log = (...a) => console.log(...a);

async function main() {
  const conn = new Connection(RPC, "confirmed");

  const payer = Keypair.generate();
  const oracle = Keypair.generate();
  const winner = Keypair.generate();
  const loser = Keypair.generate();
  for (const kp of [payer, winner, loser]) {
    await conn.confirmTransaction(await conn.requestAirdrop(kp.publicKey, 100 * LAMPORTS_PER_SOL));
  }

  const mint = await createMint(conn, payer, payer.publicKey, null, 6);
  const marketId = crypto.randomBytes(16); // fresh market per run
  const HOME = keccak("Home");
  const AWAY = keccak("Away");

  const market = pda([Buffer.from("market"), marketId]);
  const vault = pda([Buffer.from("vault"), market.toBuffer()]);
  const poolHome = pda([Buffer.from("pool"), market.toBuffer(), HOME]);
  const poolAway = pda([Buffer.from("pool"), market.toBuffer(), AWAY]);
  const posWin = pda([Buffer.from("position"), market.toBuffer(), winner.publicKey.toBuffer(), HOME]);
  const posLose = pda([Buffer.from("position"), market.toBuffer(), loser.publicKey.toBuffer(), AWAY]);

  const closeTs = Math.floor(Date.now() / 1000) + 4;

  // 1) initialize_market(market_id, kind=LiveMatch(0), oracle, close_ts)
  await send(conn, payer, [new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      meta(payer.publicKey, true, true), meta(market, false, true), meta(mint, false, false),
      meta(vault, false, true), meta(TOKEN_PROGRAM_ID, false, false),
      meta(SystemProgram.programId, false, false), meta(SYSVAR_RENT_PUBKEY, false, false),
    ],
    data: Buffer.concat([disc("initialize_market"), marketId, Buffer.from([0]), oracle.publicKey.toBuffer(), i64(closeTs)]),
  })]);
  log("✓ initialize_market");

  // 2) place_position on both sides
  for (const [bettor, sel, amt, pool, pos] of [
    [winner, HOME, 300, poolHome, posWin],
    [loser, AWAY, 100, poolAway, posLose],
  ]) {
    const ata = await getOrCreateAssociatedTokenAccount(conn, payer, mint, bettor.publicKey);
    await mintTo(conn, payer, mint, ata.address, payer, amt);
    await send(conn, bettor, [new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        meta(bettor.publicKey, true, true), meta(market, false, true), meta(vault, false, true),
        meta(pool, false, true), meta(pos, false, true), meta(ata.address, false, true),
        meta(TOKEN_PROGRAM_ID, false, false), meta(SystemProgram.programId, false, false),
      ],
      data: Buffer.concat([disc("place_position"), sel, u64(amt), u32(0)]),
    })], [bettor]);
  }
  const vaultBal = await getAccount(conn, vault);
  assert(Number(vaultBal.amount) === 400, `vault should escrow 400, got ${vaultBal.amount}`);
  log("✓ place_position x2 — vault escrows 400");

  // 3) settle_market — oracle ed25519 signature must precede settle in the tx
  await sleep((closeTs - Math.floor(Date.now() / 1000) + 1) * 1000);
  const message = Buffer.concat([marketId, HOME, i64(closeTs)]);
  const merkleRoot = keccak(message); // empty proof ⇒ leaf == root
  const settleIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      meta(payer.publicKey, true, true), meta(market, false, true),
      meta(poolHome, false, false), meta(SYSVAR_INSTRUCTIONS_PUBKEY, false, false),
    ],
    data: Buffer.concat([disc("settle_market"), HOME, merkleRoot, u32(0)]),
  });

  // negative (on the still-OPEN market): a validly-signed but WRONG signer must
  // fail the oracle binding — proves settlement is gated by TxLINE's key alone.
  const forger = Keypair.generate();
  const badEd = Ed25519Program.createInstructionWithPrivateKey({ privateKey: forger.secretKey, message });
  let forgeErr = "";
  try { await send(conn, payer, [badEd, settleIx]); } catch (e) { forgeErr = (e.logs || []).join("\n"); }
  assert(/InvalidOracleSignature/.test(forgeErr), "forged-oracle settle must fail InvalidOracleSignature");
  log("✓ forged-oracle settle rejected (InvalidOracleSignature)");

  // real settle with the true oracle key
  const edIx = Ed25519Program.createInstructionWithPrivateKey({ privateKey: oracle.secretKey, message });
  await send(conn, payer, [edIx, settleIx]);
  log("✓ settle_market — oracle signature + merkle verified on-chain");

  // 4) claim — winner takes the whole pool; loser is denied
  const winAta = await getOrCreateAssociatedTokenAccount(conn, payer, mint, winner.publicKey);
  await send(conn, winner, [new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      meta(winner.publicKey, true, true), meta(market, false, false), meta(poolHome, false, false),
      meta(posWin, false, true), meta(vault, false, true), meta(winAta.address, false, true),
      meta(TOKEN_PROGRAM_ID, false, false),
    ],
    data: disc("claim"),
  })], [winner]);
  const winBal = await getAccount(conn, winAta.address);
  assert(Number(winBal.amount) === 400, `winner payout should be 400, got ${winBal.amount}`);
  log("✓ claim — winner paid 400 (300 stake × 400 pool / 300 winning pool)");

  const loseAta = await getOrCreateAssociatedTokenAccount(conn, payer, mint, loser.publicKey);
  let loserRejected = false;
  try {
    await send(conn, loser, [new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        meta(loser.publicKey, true, true), meta(market, false, false), meta(poolHome, false, false),
        meta(posLose, false, true), meta(vault, false, true), meta(loseAta.address, false, true),
        meta(TOKEN_PROGRAM_ID, false, false),
      ],
      data: disc("claim"),
    })], [loser]);
  } catch { loserRejected = true; }
  assert(loserRejected, "loser claim must be rejected");
  log("✓ loser claim rejected");

  log("\nALL E2E ASSERTIONS PASSED ✅");
}

async function send(conn, payer, ixs, extraSigners = []) {
  const tx = new Transaction().add(...ixs);
  try {
    return await sendAndConfirmTransaction(conn, tx, [payer, ...extraSigners], { commitment: "confirmed" });
  } catch (e) {
    if (e.logs) { console.error("  program logs:\n   " + e.logs.join("\n   ")); }
    throw e;
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

main().then(() => process.exit(0)).catch((e) => { console.error("\n❌ " + e.message); process.exit(1); });
