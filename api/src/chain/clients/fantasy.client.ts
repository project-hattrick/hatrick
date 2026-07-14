/**
 * Vendored client for the `hattrick_fantasy` program (raw web3.js, no IDL).
 * Mirrors `project/contracts/programs/hattrick_fantasy/src/*`.
 *
 * 1v1 duel USDC escrow. The backend layer keypair creates the duel and settles
 * it; the two players each sign their own `deposit_stake`. Settlement is gated
 * on the matching provably-fair SeedRecord being revealed (see settle_duel).
 */
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import { Cursor, disc, i64, meta, str, u64, u8 } from './encoding';

const FANTASY_DUEL = Buffer.from('fantasy_duel');
const DUEL_VAULT = Buffer.from('duel_vault');

/** winner discriminants for settle_duel. */
export enum DuelWinner {
  TeamA = 0,
  TeamB = 1,
  Draw = 2,
}

export interface DuelStateAccount {
  duelId: string;
  layer: PublicKey;
  teamA: PublicKey;
  teamB: PublicKey;
  teamAUsdc: PublicKey;
  teamBUsdc: PublicKey;
  stakeAmount: bigint;
  expireTs: bigint;
  teamADeposited: boolean;
  teamBDeposited: boolean;
  isSettled: boolean;
  winner: number;
  bump: number;
  vaultBump: number;
}

export class HatTrickFantasyClient {
  constructor(private readonly programId: PublicKey) {}

  duelStatePda(duelId: string): PublicKey {
    return PublicKey.findProgramAddressSync(
      [FANTASY_DUEL, Buffer.from(duelId, 'utf8')],
      this.programId,
    )[0];
  }

  duelVaultPda(duelState: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync([DUEL_VAULT, duelState.toBuffer()], this.programId)[0];
  }

  /** initialize_duel(duel_id, stake_amount, expire_ts) — layer-signed. */
  buildInitializeDuel(params: {
    layer: PublicKey;
    teamA: PublicKey;
    teamB: PublicKey;
    teamAUsdc: PublicKey;
    teamBUsdc: PublicKey;
    usdcMint: PublicKey;
    duelId: string;
    stakeAmount: bigint | number;
    expireTs: bigint | number;
  }): TransactionInstruction {
    const duelState = this.duelStatePda(params.duelId);
    const duelVault = this.duelVaultPda(duelState);
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.layer, true, true),
        meta(params.teamA, false, false),
        meta(params.teamB, false, false),
        meta(params.teamAUsdc, false, false),
        meta(params.teamBUsdc, false, false),
        meta(duelState, false, true),
        meta(duelVault, false, true),
        meta(params.usdcMint, false, false),
        meta(SystemProgram.programId, false, false),
        meta(TOKEN_PROGRAM_ID, false, false),
        meta(SYSVAR_RENT_PUBKEY, false, false),
      ],
      data: Buffer.concat([
        disc('initialize_duel'),
        str(params.duelId),
        u64(params.stakeAmount),
        i64(params.expireTs),
      ]),
    });
  }

  /** deposit_stake(duel_id) — signed by the depositing player. */
  buildDepositStake(params: {
    depositor: PublicKey;
    depositorUsdc: PublicKey;
    duelId: string;
  }): TransactionInstruction {
    const duelState = this.duelStatePda(params.duelId);
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.depositor, true, true),
        meta(duelState, false, true),
        meta(this.duelVaultPda(duelState), false, true),
        meta(params.depositorUsdc, false, true),
        meta(TOKEN_PROGRAM_ID, false, false),
      ],
      data: Buffer.concat([disc('deposit_stake'), str(params.duelId)]),
    });
  }

  /**
   * settle_duel(duel_id, winner) — layer-signed. `seedRecord` is the PDA owned by
   * hattrick_provably_fair (derive it with ProvablyFairClient.seedRecordPda).
   */
  buildSettleDuel(params: {
    layer: PublicKey;
    duelId: string;
    winner: DuelWinner;
    teamAUsdc: PublicKey;
    teamBUsdc: PublicKey;
    seedRecord: PublicKey;
  }): TransactionInstruction {
    const duelState = this.duelStatePda(params.duelId);
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.layer, true, true),
        meta(duelState, false, true),
        meta(this.duelVaultPda(duelState), false, true),
        meta(params.teamAUsdc, false, true),
        meta(params.teamBUsdc, false, true),
        meta(params.seedRecord, false, false),
        meta(TOKEN_PROGRAM_ID, false, false),
      ],
      data: Buffer.concat([disc('settle_duel'), str(params.duelId), u8(params.winner)]),
    });
  }

  /** cancel_duel(duel_id) — layer-signed refund before both deposits complete. */
  buildCancelDuel(params: {
    layer: PublicKey;
    duelId: string;
    teamAUsdc: PublicKey;
    teamBUsdc: PublicKey;
  }): TransactionInstruction {
    return this.refundIx('cancel_duel', params);
  }

  /** expire_duel(duel_id) — layer-signed escape hatch after expire_ts. */
  buildExpireDuel(params: {
    layer: PublicKey;
    duelId: string;
    teamAUsdc: PublicKey;
    teamBUsdc: PublicKey;
  }): TransactionInstruction {
    return this.refundIx('expire_duel', params);
  }

  private refundIx(
    name: 'cancel_duel' | 'expire_duel',
    params: { layer: PublicKey; duelId: string; teamAUsdc: PublicKey; teamBUsdc: PublicKey },
  ): TransactionInstruction {
    const duelState = this.duelStatePda(params.duelId);
    return new TransactionInstruction({
      programId: this.programId,
      keys: [
        meta(params.layer, true, true),
        meta(duelState, false, true),
        meta(this.duelVaultPda(duelState), false, true),
        meta(params.teamAUsdc, false, true),
        meta(params.teamBUsdc, false, true),
        meta(TOKEN_PROGRAM_ID, false, false),
      ],
      data: Buffer.concat([disc(name), str(params.duelId)]),
    });
  }

  static decodeDuelState(data: Buffer): DuelStateAccount {
    const c = new Cursor(data);
    return {
      duelId: c.str(),
      layer: c.pubkey(),
      teamA: c.pubkey(),
      teamB: c.pubkey(),
      teamAUsdc: c.pubkey(),
      teamBUsdc: c.pubkey(),
      stakeAmount: c.u64(),
      expireTs: c.i64(),
      teamADeposited: c.bool(),
      teamBDeposited: c.bool(),
      isSettled: c.bool(),
      winner: c.u8(),
      bump: c.u8(),
      vaultBump: c.u8(),
    };
  }
}
