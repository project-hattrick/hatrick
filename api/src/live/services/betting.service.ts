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

import { UserRepository, WalletRepository } from '../../users/repositories';
import { BetRepository } from '../repositories';
import { BetResponseDto, BetResultDto } from '../dto/bet-response.dto';
import { CreateBetDto } from '../dto/create-bet.dto';
import { SettleableStatus } from '../dto/settle-bet.dto';

/**
 * Play-money betting loop, server-side. Every money movement is mirrored into the
 * wallet ledger (wallet_transactions) and the cached User.balance, so the balance
 * stays authoritative and auditable. (On-chain settling is deferred — Phase 2.)
 *
 * NOTE: settlement is client-reported for now (the match feed is still mocked); a
 * later TxLINE `*.after` subscription will drive it authoritatively instead.
 */
@Injectable()
export class BettingService {
  constructor(
    private readonly bets: BetRepository,
    private readonly wallet: WalletRepository,
    private readonly users: UserRepository,
  ) {}

  async list(userId: string): Promise<BetResponseDto[]> {
    const rows = await this.bets.findByUser(userId);
    return rows.map((row) => BetResponseDto.fromEntity(row));
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
    return this.result(bet, debited);
  }

  /** Resolve a pending bet: credit payout (Won) or refund the stake (Void). */
  async settle(
    userId: string,
    betId: string,
    status: SettleableStatus,
  ): Promise<BetResultDto> {
    const existing = await this.bets.findById(betId);
    if (!existing) throw new NotFoundException('Bet not found');
    if (existing.userId !== userId) throw new ForbiddenException('Not your bet');
    if (existing.status !== BetStatus.Pending) {
      throw new BadRequestException('Bet is already settled');
    }

    const settled = await this.bets.settle(betId, status);
    let user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const credit = this.payout(settled, status);
    if (credit > 0) {
      user = await this.users.adjustBalance(userId, credit);
      await this.wallet.record({
        user: { connect: { id: userId } },
        type: status === BetStatus.Won ? WalletTxType.BetPayout : WalletTxType.BetRefund,
        amount: credit,
        balanceAfter: user.balance,
        refType: 'bet',
        refId: betId,
      });
    }
    return this.result(settled, user);
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
