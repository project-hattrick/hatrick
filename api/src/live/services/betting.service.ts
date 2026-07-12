import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountType,
  BetStatus,
  WalletTxType,
  type Bet,
  type User,
} from '@prisma/client';

import { CacheService } from '../../common/cache/cache.service';
import { UserRepository, WalletRepository } from '../../users/repositories';
import { BetRepository } from '../repositories';
import { BetResponseDto, BetResultDto } from '../dto/bet-response.dto';
import { CreateBetDto } from '../dto/create-bet.dto';
import { SettleableStatus } from '../dto/settle-bet.dto';

/** Per-user bet history — short TTL, busted on every stake/settlement so a fresh bet shows at once. */
const BETS_TTL = 30;
const betsKey = (userId: string) => `bets:user:${userId}`;

/**
 * Play-money betting loop, server-side. Every money movement is mirrored into the
 * wallet ledger (wallet_transactions) and the cached User.balance, so the balance
 * stays authoritative and auditable. (On-chain settling is deferred — Phase 2.)
 *
 * Settlement on real fixtures is driven by BetSettlementService on `match-end.after`;
 * the client-reported settle endpoint remains for mock-fixture bets and is idempotent
 * (already-settled → current state). The atomic settleIfPending claim guarantees
 * exactly-once crediting whichever path lands first.
 */
@Injectable()
export class BettingService {
  constructor(
    private readonly bets: BetRepository,
    private readonly wallet: WalletRepository,
    private readonly users: UserRepository,
    private readonly cache: CacheService,
  ) {}

  async list(userId: string): Promise<BetResponseDto[]> {
    // Cache the DTO list (not entities) so Decimal/Date stay serialized; busted on place/settle.
    const cached = await this.cache.get<BetResponseDto[]>(betsKey(userId));
    if (cached) return cached;
    const rows = await this.bets.findByUser(userId);
    const dtos = rows.map((row) => BetResponseDto.fromEntity(row));
    await this.cache.set(betsKey(userId), dtos, BETS_TTL);
    return dtos;
  }

  /** Stake a bet: debit the wallet, record the ledger entry, open the bet. */
  async place(userId: string, dto: CreateBetDto): Promise<BetResultDto> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.accountType === AccountType.Collector) {
      throw new ForbiddenException(
        'Collectors cannot place bets — sign in with a wallet to compete',
      );
    }
    if (Number(user.balance) < dto.stake) {
      throw new BadRequestException('Not enough coins for this stake');
    }

    const bet = await this.bets.create({
      user: { connect: { id: userId } },
      fixtureId: dto.fixtureId,
      market: dto.market,
      selection: dto.selection,
      stake: dto.stake,
      oddsTaken: dto.oddsTaken,
    });
    const debited = await this.users.adjustBalance(userId, -dto.stake);
    await this.wallet.record({
      user: { connect: { id: userId } },
      type: WalletTxType.BetStake,
      amount: -dto.stake,
      balanceAfter: debited.balance,
      refType: 'bet',
      refId: bet.id,
    });
    await this.cache.del(betsKey(userId));
    return this.result(bet, debited);
  }

  /**
   * Resolve a pending bet: credit payout (Won) or refund the stake (Void).
   * Idempotent — an already-settled bet returns its current state so late
   * client reports (after the server settled at full time) are harmless.
   */
  async settle(
    userId: string,
    betId: string,
    status: SettleableStatus,
  ): Promise<BetResultDto> {
    const existing = await this.bets.findById(betId);
    if (!existing) throw new NotFoundException('Bet not found');
    if (existing.userId !== userId) throw new ForbiddenException('Not your bet');

    const settled = await this.bets.settleIfPending(betId, status);
    if (!settled) {
      // Already settled (possibly by the match-end.after pass) — report as-is.
      const current = (await this.bets.findById(betId)) ?? existing;
      const user = await this.users.findById(userId);
      if (!user) throw new NotFoundException('User not found');
      return this.result(current, user);
    }

    const user = await this.credit(settled, status);
    await this.cache.del(betsKey(userId));
    return this.result(settled, user);
  }

  /**
   * Settle on behalf of the system (match-end.after pass) — no ownership check.
   * Returns the settled bet, or null when the bet was already settled elsewhere.
   */
  async systemSettle(bet: Bet, status: SettleableStatus): Promise<Bet | null> {
    const settled = await this.bets.settleIfPending(bet.id, status);
    if (!settled) return null;
    await this.credit(settled, status);
    await this.cache.del(betsKey(settled.userId));
    return settled;
  }

  /** Mirror a settlement into the wallet: ledger row + cached balance. */
  private async credit(bet: Bet, status: SettleableStatus): Promise<User> {
    let user = await this.users.findById(bet.userId);
    if (!user) throw new NotFoundException('User not found');

    const credit = this.payout(bet, status);
    if (credit > 0) {
      user = await this.users.adjustBalance(bet.userId, credit);
      await this.wallet.record({
        user: { connect: { id: bet.userId } },
        type: status === BetStatus.Won ? WalletTxType.BetPayout : WalletTxType.BetRefund,
        amount: credit,
        balanceAfter: user.balance,
        refType: 'bet',
        refId: bet.id,
      });
    }
    return user;
  }

  /** Coins to credit back on settlement: full payout on a win, stake on a void, nothing on a loss. */
  private payout(bet: Bet, status: SettleableStatus): number {
    if (status === BetStatus.Won) return Math.round(Number(bet.stake) * Number(bet.oddsTaken));
    if (status === BetStatus.Void) return Math.round(Number(bet.stake));
    return 0;
  }

  private result(bet: Bet, user: User): BetResultDto {
    return { bet: BetResponseDto.fromEntity(bet), balance: user.balance.toFixed(2) };
  }
}
