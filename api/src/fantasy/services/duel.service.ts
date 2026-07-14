import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DuelResult, DuelStatus, NotificationType, WalletTxType, type OwnedCard } from '@prisma/client';

import { EventName } from '../../events/enums/event-name.enum';
import { NotificationsService } from '../../users/notifications.service';
import { UserRepository, WalletRepository } from '../../users/repositories';
import { DuelRepository, OwnedCardRepository } from '../repositories';
import { CreateDuelDto, DuelDto, DuelResultDto, SettleDuelDto } from '../dto/duel.dto';
import { DUEL_MMR_DELTA } from '../fantasy.constants';
import type { DuelFinishedPayload } from '../../chain/services/duel-chain.service';

/**
 * 1v1 duel lifecycle, server-side. Opponents are personas (vs CPU → guestId null).
 * Stake/reward flow through the wallet ledger (DuelStake/DuelReward) and the outcome
 * updates the cached ranking. Mirrors the betting.service ledger pattern.
 */
@Injectable()
export class DuelService {
  constructor(
    private readonly duels: DuelRepository,
    private readonly owned: OwnedCardRepository,
    private readonly users: UserRepository,
    private readonly wallet: WalletRepository,
    private readonly notifications: NotificationsService,
    private readonly events: EventEmitter2,
  ) {}

  async list(userId: string): Promise<DuelDto[]> {
    const rows = await this.duels.findByUser(userId);
    return rows.map((row) => DuelDto.fromEntity(row));
  }

  async create(userId: string, dto: CreateDuelDto): Promise<DuelResultDto> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (dto.stake > 0 && Number(user.balance) < dto.stake) {
      throw new BadRequestException('Not enough coins for this stake');
    }
    // Ownership check on the fielded XI.
    const ownedIds = new Set((await this.owned.findByUser(userId)).map((oc: OwnedCard) => oc.id));
    if (!dto.ownedCardIds.every((id) => ownedIds.has(id))) {
      throw new ForbiddenException('A fielded card is not in your collection');
    }

    const duel = await this.duels.create({
      host: { connect: { id: userId } },
      mode: dto.mode,
      status: DuelStatus.Live,
      stake: dto.stake,
      startedAt: new Date(),
    });

    let balance = user.balance;
    if (dto.stake > 0) {
      const debited = await this.users.adjustBalance(userId, -dto.stake);
      balance = debited.balance;
      await this.wallet.record({
        user: { connect: { id: userId } },
        type: WalletTxType.DuelStake,
        amount: -dto.stake,
        balanceAfter: debited.balance,
        refType: 'duel',
        refId: duel.id,
      });
    }

    await this.duels.addLineup({
      duel: { connect: { id: duel.id } },
      user: { connect: { id: userId } },
      lineupSnapshot: {
        formation: dto.formation,
        ownedCardIds: dto.ownedCardIds,
        opponentName: dto.opponentName ?? null,
      },
    });

    return { duel: DuelDto.fromEntity(duel), balance: balance.toFixed(2) };
  }

  async settle(userId: string, duelId: string, dto: SettleDuelDto): Promise<DuelResultDto> {
    const duel = await this.duels.findById(duelId);
    if (!duel) throw new NotFoundException('Duel not found');
    if (duel.hostId !== userId) throw new ForbiddenException('Not your duel');
    if (duel.status === DuelStatus.Finished) {
      throw new BadRequestException('Duel already settled');
    }

    const mmrDelta =
      dto.result === DuelResult.Win
        ? DUEL_MMR_DELTA
        : dto.result === DuelResult.Loss
          ? -DUEL_MMR_DELTA
          : 0;

    const finished = await this.duels.finish(duelId, {
      hostScore: dto.hostScore,
      guestScore: dto.guestScore,
      winner: dto.result === DuelResult.Win ? { connect: { id: userId } } : undefined,
      hostResult: dto.result,
      mmrDelta,
    });
    await this.users.recordDuelOutcome(userId, dto.result, mmrDelta);

    // Win → 2× stake back (net +stake); Draw → refund stake; Loss → nothing.
    const stake = Number(duel.stake);
    const credit =
      dto.result === DuelResult.Win ? stake * 2 : dto.result === DuelResult.Draw ? stake : 0;
    let balance = (await this.users.findById(userId))!.balance;
    if (credit > 0) {
      const rewarded = await this.users.adjustBalance(userId, credit);
      balance = rewarded.balance;
      await this.wallet.record({
        user: { connect: { id: userId } },
        type: WalletTxType.DuelReward,
        amount: credit,
        balanceAfter: rewarded.balance,
        refType: 'duel',
        refId: duelId,
      });
    }

    const title =
      dto.result === DuelResult.Win
        ? 'Duel won'
        : dto.result === DuelResult.Draw
          ? 'Duel drawn'
          : 'Duel lost';
    await this.notifications.notify(userId, {
      type: NotificationType.Duel,
      title,
      body: `${dto.hostScore}–${dto.guestScore}${mmrDelta !== 0 ? ` · ${mmrDelta > 0 ? '+' : ''}${mmrDelta} MMR` : ''}`,
      href: '/profile',
    });

    // Mirror to the on-chain fantasy escrow (no-op when chain is disabled or the
    // opponent was CPU — DuelChainService gates on both). Fire-and-forget: chain
    // failures must not fail the off-chain settle.
    const payload: DuelFinishedPayload = {
      duelId,
      hostId: duel.hostId,
      guestId: duel.guestId,
      hostResult: dto.result,
      hostScore: dto.hostScore,
      guestScore: dto.guestScore,
      stake,
    };
    this.events.emit(EventName.DuelSettledAfter, payload);

    return { duel: DuelDto.fromEntity(finished), balance: balance.toFixed(2) };
  }
}
