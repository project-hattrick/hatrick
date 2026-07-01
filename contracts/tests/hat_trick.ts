// Happy-path harness for the hat_trick program. Doubles as the reference for
// how the keeper (api) and wallet flow (front) build a settle transaction:
// an Ed25519Program instruction must precede `settle_market` in the same tx.
//
// Run: `anchor test` (spins up a local validator).

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Ed25519Program,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccount,
  createMint,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { keccak_256 } from "js-sha3";
import { assert } from "chai";
import { HatTrick } from "../target/types/hat_trick";

const enc = (s: string) => Buffer.from(keccak_256.arrayBuffer(s));
const u16le = (n: number) => {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
};

describe("hat_trick", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.HatTrick as Program<HatTrick>;
  const authority = provider.wallet as anchor.Wallet;

  const oracle = Keypair.generate();
  const bettorWin = Keypair.generate();
  const bettorLose = Keypair.generate();
  const marketId = Buffer.alloc(16, 7); // opaque id
  const HOME = enc("Home");
  const AWAY = enc("Away");

  let mint: PublicKey;
  let market: PublicKey;
  let vault: PublicKey;

  const pda = (seeds: Buffer[]) =>
    PublicKey.findProgramAddressSync(seeds, program.programId)[0];

  before(async () => {
    for (const kp of [bettorWin, bettorLose, oracle]) {
      const sig = await provider.connection.requestAirdrop(kp.publicKey, 2e9);
      await provider.connection.confirmTransaction(sig);
    }
    mint = await createMint(provider.connection, authority.payer, authority.publicKey, null, 6);
    market = pda([Buffer.from("market"), marketId]);
    vault = pda([Buffer.from("vault"), market.toBuffer()]);
  });

  it("initializes a market", async () => {
    const closeTs = new anchor.BN(Math.floor(Date.now() / 1000) + 2);
    await program.methods
      .initializeMarket([...marketId], { liveMatch: {} }, oracle.publicKey, closeTs, new anchor.BN(3600))
      .accounts({ authority: authority.publicKey, market, mint, vault })
      .rpc();
    const m = await program.account.market.fetch(market);
    assert.equal(m.totalPool.toNumber(), 0);
  });

  it("accepts positions on both sides", async () => {
    for (const [bettor, sel, amt] of [
      [bettorWin, HOME, 300],
      [bettorLose, AWAY, 100],
    ] as const) {
      const ata = await createAssociatedTokenAccount(
        provider.connection, authority.payer, mint, bettor.publicKey,
      );
      await mintTo(provider.connection, authority.payer, mint, ata, authority.publicKey, amt);
      await program.methods
        .placePosition([...sel], new anchor.BN(amt), 0)
        .accounts({ bettor: bettor.publicKey, market, vault, bettorToken: ata })
        .signers([bettor])
        .rpc();
    }
    const m = await program.account.market.fetch(market);
    assert.equal(m.totalPool.toNumber(), 400);
  });

  it("settles from an oracle-signed result", async () => {
    await new Promise((r) => setTimeout(r, 2500)); // pass close_ts
    const m = await program.account.market.fetch(market);

    // canonical message = market_id(16) || winning_selection(32) || close_ts(8 LE)
    const closeTs = Buffer.alloc(8);
    closeTs.writeBigInt64LE(BigInt(m.closeTs.toString()));
    const leaf = Buffer.from(keccak_256.arrayBuffer(Buffer.concat([marketId, HOME, closeTs])));
    const merkleRoot = leaf; // empty proof ⇒ leaf == root
    // oracle signs the root too: market_id || winning_selection || merkle_root || close_ts
    const message = Buffer.concat([marketId, HOME, merkleRoot, closeTs]);

    const edIx = Ed25519Program.createInstructionWithPrivateKey({
      privateKey: oracle.secretKey,
      message,
    });

    await program.methods
      .settleMarket([...HOME], [...merkleRoot], [])
      .accounts({
        settler: authority.publicKey,
        market,
        winningPool: pda([Buffer.from("pool"), market.toBuffer(), HOME]),
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .preInstructions([edIx])
      .rpc();

    const settled = await program.account.market.fetch(market);
    assert.deepEqual(settled.status, { settled: {} });
    assert.equal(settled.winningPool.toNumber(), 300);
  });

  it("pays the winner the whole pool, rejects the loser", async () => {
    const winnerAta = await getOrCreateAta(bettorWin.publicKey);
    await program.methods
      .claim()
      .accounts({
        winner: bettorWin.publicKey,
        market,
        winningPool: pda([Buffer.from("pool"), market.toBuffer(), HOME]),
        position: pda([Buffer.from("position"), market.toBuffer(), bettorWin.publicKey.toBuffer(), HOME]),
        vault,
        winnerToken: winnerAta,
      })
      .signers([bettorWin])
      .rpc();

    const bal = await getAccount(provider.connection, winnerAta);
    assert.equal(Number(bal.amount), 400); // 300 stake * 400 total / 300 winning pool

    let rejected = false;
    try {
      await program.methods
        .claim()
        .accounts({
          winner: bettorLose.publicKey,
          market,
          winningPool: pda([Buffer.from("pool"), market.toBuffer(), HOME]),
          position: pda([Buffer.from("position"), market.toBuffer(), bettorLose.publicKey.toBuffer(), AWAY]),
          vault,
          winnerToken: await getOrCreateAta(bettorLose.publicKey),
        })
        .signers([bettorLose])
        .rpc();
    } catch {
      rejected = true;
    }
    assert.isTrue(rejected, "loser claim must fail");
  });

  async function getOrCreateAta(owner: PublicKey): Promise<PublicKey> {
    try {
      return await createAssociatedTokenAccount(provider.connection, authority.payer, mint, owner);
    } catch {
      const { getAssociatedTokenAddress } = await import("@solana/spl-token");
      return getAssociatedTokenAddress(mint, owner);
    }
  }
});

void u16le; // reserved helper for manual ed25519 layout assertions
