// Happy-path harness for hattrick_betting. Doubles as the reference for
// how the keeper (txline-service) and wallet flow (frontend) build a settle
// transaction: an Ed25519Program instruction must precede `settle_market`
// in the same tx.
//
// Run: `anchor test` (spins up a local validator).

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Ed25519Program,
  Keypair,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccount,
  createMint,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { keccak_256 } from "js-sha3";
import { assert } from "chai";
import { HattrickBetting } from "../target/types/hattrick_betting";

const enc = (s: string) => Buffer.from(keccak_256.arrayBuffer(s));

describe("hattrick_betting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.HattrickBetting as Program<HattrickBetting>;
  const authority = provider.wallet as anchor.Wallet;

  const oracle     = Keypair.generate();
  const bettorWin  = Keypair.generate();
  const bettorLose = Keypair.generate();
  const marketId   = Buffer.alloc(16, 7);
  const HOME = enc("Home");
  const AWAY = enc("Away");

  let mint:   PublicKey;
  let market: PublicKey;
  let vault:  PublicKey;

  const pda = (seeds: Buffer[]) =>
    PublicKey.findProgramAddressSync(seeds, program.programId)[0];

  before(async () => {
    for (const kp of [bettorWin, bettorLose, oracle]) {
      const sig = await provider.connection.requestAirdrop(kp.publicKey, 2e9);
      await provider.connection.confirmTransaction(sig);
    }
    mint   = await createMint(provider.connection, authority.payer, authority.publicKey, null, 6);
    market = pda([Buffer.from("market"), marketId]);
    vault  = pda([Buffer.from("vault"), market.toBuffer()]);
  });

  it("initializes a market", async () => {
    const closeTs = new anchor.BN(Math.floor(Date.now() / 1000) + 2);
    await program.methods
      .initializeMarket([...marketId], oracle.publicKey, closeTs, new anchor.BN(3600))
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

  it("settles from an oracle-signed result (ed25519 + Merkle proof)", async () => {
    await new Promise((r) => setTimeout(r, 2500)); // pass close_ts
    const m = await program.account.market.fetch(market);

    // leaf = keccak(market_id || winning_selection || close_ts_le8)
    const closeTs = Buffer.alloc(8);
    closeTs.writeBigInt64LE(BigInt(m.closeTs.toString()));
    const leaf       = Buffer.from(keccak_256.arrayBuffer(Buffer.concat([marketId, HOME, closeTs])));
    const merkleRoot = leaf; // empty proof ⇒ leaf == root

    // oracle signs: market_id || winning_selection || merkle_root || close_ts
    const message = Buffer.concat([marketId, HOME, merkleRoot, closeTs]);
    const edIx = Ed25519Program.createInstructionWithPrivateKey({
      privateKey: oracle.secretKey,
      message,
    });

    await program.methods
      .settleMarket([...HOME], [...merkleRoot], [])
      .accounts({
        settler:      authority.publicKey,
        market,
        winningPool:  pda([Buffer.from("pool"), market.toBuffer(), HOME]),
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .preInstructions([edIx])
      .rpc();

    const settled = await program.account.market.fetch(market);
    assert.deepEqual(settled.status, { settled: {} });
    assert.equal(settled.winningPool.toNumber(), 300);
  });

  it("pays winner the pari-mutuel share and rejects loser", async () => {
    const winnerAta = await getOrCreateAta(bettorWin.publicKey);
    await program.methods
      .claim()
      .accounts({
        winner:      bettorWin.publicKey,
        market,
        winningPool: pda([Buffer.from("pool"), market.toBuffer(), HOME]),
        position:    pda([Buffer.from("position"), market.toBuffer(), bettorWin.publicKey.toBuffer(), HOME]),
        vault,
        winnerToken: winnerAta,
      })
      .signers([bettorWin])
      .rpc();

    const bal = await getAccount(provider.connection, winnerAta);
    assert.equal(Number(bal.amount), 400); // 300 stake * 400 total / 300 winning_pool

    let rejected = false;
    try {
      await program.methods
        .claim()
        .accounts({
          winner:      bettorLose.publicKey,
          market,
          winningPool: pda([Buffer.from("pool"), market.toBuffer(), HOME]),
          position:    pda([Buffer.from("position"), market.toBuffer(), bettorLose.publicKey.toBuffer(), AWAY]),
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

  it("voids an unsettled market after void_delay and refunds bettors", async () => {
    // Create a separate market with short void_delay for this test
    const voidMarketId = Buffer.alloc(16, 9);
    const voidMarket   = pda([Buffer.from("market"), voidMarketId]);
    const voidVault    = pda([Buffer.from("vault"),  voidMarket.toBuffer()]);

    const closeTs = new anchor.BN(Math.floor(Date.now() / 1000) - 5); // already past
    await program.methods
      .initializeMarket([...voidMarketId], { liveMatch: {} }, oracle.publicKey, closeTs, new anchor.BN(1))
      .accounts({ authority: authority.publicKey, market: voidMarket, mint, vault: voidVault })
      .rpc();

    // Place a position
    const bettor = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(bettor.publicKey, 2e9);
    await provider.connection.confirmTransaction(sig);
    const ata = await createAssociatedTokenAccount(provider.connection, authority.payer, mint, bettor.publicKey);
    await mintTo(provider.connection, authority.payer, mint, ata, authority.publicKey, 50);
    await program.methods
      .placePosition([...HOME], new anchor.BN(50), 0)
      .accounts({ bettor: bettor.publicKey, market: voidMarket, vault: voidVault, bettorToken: ata })
      .signers([bettor])
      .rpc();

    // Void the market
    await program.methods.voidMarket()
      .accounts({ caller: authority.publicKey, market: voidMarket })
      .rpc();

    // Refund
    await program.methods.refund([...HOME])
      .accounts({
        owner:      bettor.publicKey,
        market:     voidMarket,
        position:   pda([Buffer.from("position"), voidMarket.toBuffer(), bettor.publicKey.toBuffer(), HOME]),
        vault:      voidVault,
        ownerToken: ata,
      })
      .signers([bettor])
      .rpc();

    const bal = await getAccount(provider.connection, ata);
    assert.equal(Number(bal.amount), 50);
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
