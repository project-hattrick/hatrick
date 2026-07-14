import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DuelResult, DuelStatus, SeedCommitContext, WalletTxType } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

import { EventName } from '../../events/enums/event-name.enum';
import { ChainConfig } from '../chain.config';
import { SolanaService } from './solana.service';
import { ProvablyFairService } from './provably-fair.service';
import { DuelWinner } from '../clients/fantasy.client';
import { UserRepository } from '../../users/repositories/user.repository';
import { WalletRepository } from '../../users/repositories/wallet.repository';
import { DuelRepository } from '../../fantasy/repositories';

/**
 * Payload emitted by DuelService after a duel finishes (off-chain settle path).
 * We listen here and mirror to chain (reveal + settle_duel) asynchronously.
 */
export interface DuelFinishedPayload {
  duelId: string;
  hostId: string;
  guestId: string | null;
  hostResult: DuelResult;
  hostScore: number;
  guestScore: number;
  stake: number;
}

/** Internal: minimal duel shape needed by chain methods (avoids importing fantasy module). */
export interface DuelChainInput {
  duelId: string;
  hostWallet: string;
  guestWallet: string;
  /** Stake in whole USDC units (will be multiplied by 10^6 decimals). */
  stakeAmount: number;
  /** Unix timestamp after which the duel can be expired on-chain (seconds). */
  expireTs: number;
}

/** Emitted by DuelService.join() once a real second player + both wallets are known. */
export interface DuelReadyPayload {
  duelId: string;
  hostWallet: string;
  guestWallet: string;
  stake: number;
}

/** Hours a duel escrow can sit before the layer may force-expire (refund) it. */
const DUEL_EXPIRE_HOURS = 24;

/**
 * Wires the fantasy duel lifecycle to the on-chain hattrick_fantasy program.
 *
 * Flow:
 *   1. initializeDuel()     — layer-signed initialize_duel + commit_seed.
 *   2. buildDepositStake()  — unsigned tx for each player to sign in the front.
 *   3. @OnEvent(duel-settled.after) — reveal seed + settle_duel on-chain, then
 *      update DB with chain tx sigs.
 *
 * All methods gate on cfg.enabled so SOLANA_ENABLED=false keeps the existing
 * off-chain flow working with zero chain calls.
 */
@Injectable()
export class DuelChainService {
  private readonly logger = new Logger(DuelChainService.name);

  constructor(
    private readonly cfg: ChainConfig,
    private readonly solana: SolanaService,
    private readonly pf: ProvablyFairService,
    private readonly users: UserRepository,
    private readonly wallet: WalletRepository,
    private readonly duels: DuelRepository,
  ) {}

  /**
   * A real second player joined a PvP duel — initialise the on-chain escrow and
   * mirror the init tx signature onto the duel row. Best-effort: chain failures
   * must not break the off-chain duel (players can still play; escrow just won't
   * back it). No-op when chain is disabled.
   */
  @OnEvent(EventName.DuelReadyAfter)
  async onDuelReady(payload: DuelReadyPayload): Promise<void> {
    if (!this.cfg.enabled) return;
    try {
      const expireTs = Math.floor(Date.now() / 1000) + DUEL_EXPIRE_HOURS * 3600;
      const { initTxSig } = await this.initializeDuel({
        duelId: payload.duelId,
        hostWallet: payload.hostWallet,
        guestWallet: payload.guestWallet,
        stakeAmount: payload.stake,
        expireTs,
      });
      await this.duels.setChainSig(payload.duelId, { chainInitTxSig: initTxSig });
    } catch (err) {
      this.logger.error(`onChain init failed for duel ${payload.duelId}: ${String(err)}`);
    }
  }

  /**
   * Layer-signed initialize_duel + provably-fair commit_seed.
   * Called when both players and stake are confirmed (DuelStatus.Live).
   */
  async initializeDuel(input: DuelChainInput): Promise<{ initTxSig: string }> {
    if (!this.cfg.enabled) {
      this.logger.debug(`chain disabled — skipping initializeDuel ${input.duelId}`);
      return { initTxSig: 'mock-init' };
    }

    const usdcMint = this.cfg.usdcMint();
    if (!usdcMint) throw new Error('USDC_MINT must be set for on-chain duels');

    const layer = this.cfg.layer();
    const hostPk = new PublicKey(input.hostWallet);
    const guestPk = new PublicKey(input.guestWallet);
    const hostUsdc = getAssociatedTokenAddressSync(usdcMint, hostPk);
    const guestUsdc = getAssociatedTokenAddressSync(usdcMint, guestPk);

    const decimals = this.cfg.playTokenDecimals;
    const rawStake = BigInt(input.stakeAmount) * 10n ** BigInt(decimals);

    const ix = this.solana.fantasyClient.buildInitializeDuel({
      layer: layer.publicKey,
      teamA: hostPk,
      teamB: guestPk,
      teamAUsdc: hostUsdc,
      teamBUsdc: guestUsdc,
      usdcMint,
      duelId: input.duelId,
      stakeAmount: rawStake,
      expireTs: input.expireTs,
    });

    const initTxSig = await this.solana.send([ix], [layer]);
    this.logger.log(`initialize_duel ${input.duelId} txSig=${initTxSig}`);

    // Commit the provably-fair seed (duel variant) concurrently with init.
    await this.pf.commit(input.duelId, SeedCommitContext.Duel);

    return { initTxSig };
  }

  /**
   * Build an unsigned deposit_stake transaction for a player to sign.
   * The depositor's wallet signs their own token transfer to the vault.
   */
  async buildDepositStake(
    duelId: string,
    depositorWallet: string,
  ): Promise<{ transaction: string }> {
    this.solana.ensureEnabled();

    const usdcMint = this.cfg.usdcMint();
    if (!usdcMint) throw new Error('USDC_MINT must be set for on-chain duels');

    const depositorPk = new PublicKey(depositorWallet);
    const depositorUsdc = getAssociatedTokenAddressSync(usdcMint, depositorPk);

    const ix = this.solana.fantasyClient.buildDepositStake({
      depositor: depositorPk,
      depositorUsdc,
      duelId,
    });

    const transaction = await this.solana.buildUnsigned([ix], depositorPk);
    return { transaction };
  }

  /**
   * Settle the duel on-chain after the off-chain simulation finishes.
   * Listens to the internal `duel-settled.after` event emitted by DuelService.
   * Best-effort: logs and does NOT rethrow (chain failure must not break UI).
   */
  @OnEvent(EventName.DuelSettledAfter)
  async onDuelSettled(payload: DuelFinishedPayload): Promise<void> {
    if (!this.cfg.enabled) return;
    if (!payload.guestId) {
      // CPU opponent — no on-chain duel was initialized.
      return;
    }
    try {
      await this.settleDuelOnChain(payload);
    } catch (err) {
      this.logger.error(`onChain settle failed for duel ${payload.duelId}: ${String(err)}`);
    }
  }

  private async settleDuelOnChain(payload: DuelFinishedPayload): Promise<void> {
    const usdcMint = this.cfg.usdcMint();
    if (!usdcMint) throw new Error('USDC_MINT must be set for on-chain duels');

    const host = await this.users.findById(payload.hostId);
    const guest = await this.users.findById(payload.guestId!);
    if (!host || !guest) {
      this.logger.warn(`duel ${payload.duelId}: host or guest not found — skipping chain settle`);
      return;
    }

    const hostPk = new PublicKey(host.walletAddress);
    const guestPk = new PublicKey(guest.walletAddress);
    const hostUsdc = getAssociatedTokenAddressSync(usdcMint, hostPk);
    const guestUsdc = getAssociatedTokenAddressSync(usdcMint, guestPk);

    // Reveal the seed first — settle_duel gate requires is_revealed=true.
    await this.pf.reveal(payload.duelId);

    const winner = this.mapWinner(payload.hostResult);
    const layer = this.cfg.layer();
    const seedRecord = this.solana.provablyFairClient.seedRecordPda(payload.duelId);

    const ix = this.solana.fantasyClient.buildSettleDuel({
      layer: layer.publicKey,
      duelId: payload.duelId,
      winner,
      teamAUsdc: hostUsdc,
      teamBUsdc: guestUsdc,
      seedRecord,
    });

    const settleSig = await this.solana.send([ix], [layer]);
    this.logger.log(`settle_duel ${payload.duelId} winner=${DuelWinner[winner]} txSig=${settleSig}`);

    // Mirror: no additional coin credit needed — DuelService already ran the
    // off-chain wallet ledger. We only persist the on-chain settle signature
    // (DuelRepository is exported by FantasyModule, imported by ChainModule —
    // one-directional, so no circular dependency).
    await this.duels.setChainSig(payload.duelId, { chainSettleTxSig: settleSig });
  }

  private mapWinner(result: DuelResult): DuelWinner {
    switch (result) {
      case DuelResult.Win:
        return DuelWinner.TeamA;
      case DuelResult.Loss:
        return DuelWinner.TeamB;
      case DuelResult.Draw:
        return DuelWinner.Draw;
    }
  }
}
