import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PackType } from '@prisma/client';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChainConfig } from './chain.config';
import { SolanaService } from './services/solana.service';
import { DuelChainService } from './services/duel-chain.service';
import { PackChainService } from './services/pack-chain.service';
import { UserRepository } from '../users/repositories/user.repository';
import { PrismaService } from '../prisma/prisma.service';

interface DepositBuildBody {
  /** The depositing player's wallet address (must match the JWT). */
  walletAddress?: string;
}

interface OpenPackBody {
  templateId?: string;
  packType?: string;
  packOpeningId?: string;
}

interface FulfillPackBody {
  packMint?: string;
  templateId?: string;
  packType?: string;
  packOpeningId?: string;
}

interface ConfirmBody {
  /** The signature to verify on-chain. */
  signature?: string;
  /** Semantic kind so we know which mirror to reconcile. */
  kind?: 'deposit' | 'open_pack' | 'other';
}

/**
 * HTTP surface for client-signed on-chain operations.
 *
 * Endpoints:
 *   POST /chain/duels/:duelId/deposit/build    → unsigned deposit_stake tx
 *   POST /chain/packs/open/build               → unsigned open_pack tx
 *   POST /chain/packs/:packOpenId/fulfill       → layer-signed fulfill_pack
 *   POST /chain/confirm                         → verify tx + reconcile DB mirror
 *   GET  /chain/balance                         → on-chain token balance (source of truth)
 */
@ApiTags('Chain')
@Controller('chain')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChainController {
  private readonly logger = new Logger(ChainController.name);

  constructor(
    private readonly cfg: ChainConfig,
    private readonly solana: SolanaService,
    private readonly duels: DuelChainService,
    private readonly packs: PackChainService,
    private readonly users: UserRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Duels
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * POST /chain/duels/:duelId/deposit/build
   * Build an unsigned deposit_stake tx for the authenticated player.
   *
   * Request body: { walletAddress: string }
   * Response:     { transaction: string } (base64 serialized Transaction)
   */
  @Post('duels/:duelId/deposit/build')
  @ApiOperation({ summary: 'Build unsigned deposit_stake tx for a duel' })
  async buildDeposit(
    @Param('duelId') duelId: string,
    @Body() body: DepositBuildBody,
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<{ transaction: string }> {
    if (!body.walletAddress) {
      throw new BadRequestException('walletAddress is required');
    }
    if (body.walletAddress !== principal.walletAddress) {
      throw new BadRequestException('walletAddress must match the authenticated wallet');
    }
    try {
      new PublicKey(body.walletAddress);
    } catch {
      throw new BadRequestException('walletAddress is not a valid Solana public key');
    }
    return this.duels.buildDepositStake(duelId, body.walletAddress);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Packs
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * POST /chain/packs/open/build
   * Commit provably-fair seed + build unsigned open_pack tx.
   *
   * Request body: { templateId: string, packType: PackType, packOpeningId: string }
   * Response:     { transaction, packOpenId, packMint, templateId, vaultCategories }
   */
  @Post('packs/open/build')
  @ApiOperation({ summary: 'Build unsigned open_pack tx (commits provably-fair seed)' })
  async buildOpenPack(
    @Body() body: OpenPackBody,
    @CurrentUser() principal: AuthenticatedUser,
  ) {
    const { templateId, packType, packOpeningId } = body;
    if (!templateId || !packType || !packOpeningId) {
      throw new BadRequestException('templateId, packType and packOpeningId are required');
    }
    if (!Object.values(PackType).includes(packType as PackType)) {
      throw new BadRequestException(`unknown packType: ${packType}`);
    }
    return this.packs.buildOpenPack(principal.userId, templateId, packType as PackType);
  }

  /**
   * POST /chain/packs/:packOpenId/fulfill
   * After the user's open_pack confirms: reveal seed + layer-signed fulfill_pack
   * + mirror OwnedCard rows.
   *
   * Request body: { packMint, templateId, packType, packOpeningId }
   * Response:     { cards: [{ ownedCardId, assetMint, realPlayerId }], mintTxSig }
   */
  @Post('packs/:packOpenId/fulfill')
  @ApiOperation({ summary: 'Fulfill a pack (layer-signed, mints cNFTs, mirrors OwnedCards)' })
  async fulfillPack(
    @Param('packOpenId') packOpenId: string,
    @Body() body: FulfillPackBody,
    @CurrentUser() principal: AuthenticatedUser,
  ) {
    const { packMint, templateId, packType, packOpeningId } = body;
    if (!packMint || !templateId || !packType || !packOpeningId) {
      throw new BadRequestException(
        'packMint, templateId, packType and packOpeningId are required',
      );
    }
    if (!Object.values(PackType).includes(packType as PackType)) {
      throw new BadRequestException(`unknown packType: ${packType}`);
    }
    return this.packs.fulfillPack({
      userId: principal.userId,
      packOpenId,
      packMint,
      templateId,
      packType: packType as PackType,
      packOpeningId,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Confirm / reconcile
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * POST /chain/confirm
   * Verify a user-submitted signature is confirmed on-chain then reconcile
   * the relevant DB mirror (best-effort, idempotent).
   *
   * Request body: { signature: string, kind: 'deposit' | 'open_pack' | 'other' }
   * Response:     { confirmed: boolean, slot?: number }
   */
  @Post('confirm')
  @ApiOperation({ summary: 'Verify tx confirmation + reconcile DB mirror' })
  async confirm(
    @Body() body: ConfirmBody,
    @CurrentUser() _principal: AuthenticatedUser,
  ): Promise<{ confirmed: boolean; slot?: number }> {
    if (!body.signature) throw new BadRequestException('signature is required');
    if (!body.kind) throw new BadRequestException('kind is required');

    if (!this.cfg.enabled) {
      return { confirmed: true };
    }

    try {
      const statuses = await this.solana.connection.getSignatureStatuses([body.signature]);
      const status = statuses.value[0];
      if (!status || status.err) {
        return { confirmed: false };
      }
      return {
        confirmed: status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized',
        slot: status.slot,
      };
    } catch (err) {
      this.logger.warn(`confirm check failed for ${body.signature}: ${String(err)}`);
      return { confirmed: false };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Balance
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * GET /chain/balance
   * Read the user's on-chain play-token and USDC ATA balances (source of truth)
   * and return them. Also updates User.balance mirror if the play-token differs.
   *
   * Response: { playToken: string, usdc: string, walletAddress: string }
   */
  @Get('balance')
  @ApiOperation({ summary: 'On-chain token balances (source of truth)' })
  async balance(
    @CurrentUser() principal: AuthenticatedUser,
  ): Promise<{ playToken: string; usdc: string; walletAddress: string }> {
    if (!this.cfg.enabled) {
      throw new ServiceUnavailableException('Solana features are disabled (SOLANA_ENABLED!=true).');
    }

    const userPk = new PublicKey(principal.walletAddress);
    const playMint = this.cfg.playTokenMint();
    const usdcMint = this.cfg.usdcMint();

    let playTokenBalance = '0';
    let usdcBalance = '0';

    if (playMint) {
      try {
        const ata = getAssociatedTokenAddressSync(playMint, userPk);
        const info = await this.solana.connection.getTokenAccountBalance(ata);
        playTokenBalance = info.value.uiAmountString ?? '0';

        // Mirror: update User.balance to the on-chain value.
        const onChainAmount = info.value.uiAmount ?? 0;
        await this.prisma.user.update({
          where: { id: principal.userId },
          data: { balance: onChainAmount },
        });
      } catch {
        // ATA might not exist yet (user hasn't received tokens).
        playTokenBalance = '0';
      }
    }

    if (usdcMint && usdcMint.toBase58() !== playMint?.toBase58()) {
      try {
        const ata = getAssociatedTokenAddressSync(usdcMint, userPk);
        const info = await this.solana.connection.getTokenAccountBalance(ata);
        usdcBalance = info.value.uiAmountString ?? '0';
      } catch {
        usdcBalance = '0';
      }
    }

    return { playToken: playTokenBalance, usdc: usdcBalance, walletAddress: principal.walletAddress };
  }
}
