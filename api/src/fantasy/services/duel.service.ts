import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DuelMode,
  DuelResult,
  DuelStatus,
  NotificationType,
  WalletTxType,
  type OwnedCard,
} from '@prisma/client';

import { EventName } from '../../events/enums/event-name.enum';
import { NotificationsService } from '../../users/notifications.service';
import { UserGateway } from '../../users/user.gateway';
import { UserEvent } from '../../users/enums/user-event.enum';
import { UserRepository, WalletRepository } from '../../users/repositories';
import { DuelRepository, OwnedCardRepository } from '../repositories';
import {
  CreateDuelDto,
  DuelDetailDto,
  DuelDto,
  DuelLineupSnapshotDto,
  DuelPlayerDto,
  DuelResultDto,
  EnterMatchmakingDto,
  JoinDuelDto,
  SettleDuelDto,
} from '../dto/duel.dto';
import { DUEL_MMR_DELTA } from '../fantasy.constants';
import type {
  DuelFinishedPayload,
  DuelReadyPayload,
} from '../../chain/services/duel-chain.service';

interface MatchmakingEntry {
  userId: string;
  formation: string;
  ownedCardIds: string[];
  queuedAt: number;
}

/**
 * 1v1 duel lifecycle, server-side.
 *
 * Two modes:
 *  - vs-CPU  (`pvp` falsy)  → guestId remains null, settle is host-only.
 *  - PvP     (`pvp` true)   → a second real user joins; both sides settle atomically.
 *
 * Stake/reward flow through the wallet ledger (DuelStake/DuelReward) and the
 * outcome updates the cached ranking. Mirrors the betting.service ledger pattern.
 */
@Injectable()
export class DuelService {
  private readonly matchmakingQueue = new Map<string, MatchmakingEntry>();

  constructor(
    private readonly duels: DuelRepository,
    private readonly owned: OwnedCardRepository,
    private readonly users: UserRepository,
    private readonly wallet: WalletRepository,
    private readonly notifications: NotificationsService,
    private readonly userGateway: UserGateway,
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
    if (dto.pvp && dto.opponentUserId) {
      if (dto.opponentUserId === userId) {
        throw new BadRequestException('You cannot challenge yourself');
      }
      const opponent = await this.users.findById(dto.opponentUserId);
      if (!opponent) throw new NotFoundException('Opponent user not found');
    }
    // Ownership check on the fielded XI.
    const ownedIds = new Set(
      (await this.owned.findByUser(userId)).map((oc: OwnedCard) => oc.id),
    );
    if (!dto.ownedCardIds.every((id) => ownedIds.has(id))) {
      throw new ForbiddenException('A fielded card is not in your collection');
    }

    // A PvP challenge opens as Pending (awaiting a second player). A vs-CPU duel
    // goes Live immediately as before.
    const duel = await this.duels.create({
      host: { connect: { id: userId } },
      mode: dto.mode,
      status: dto.pvp ? DuelStatus.Pending : DuelStatus.Live,
      stake: dto.stake,
      startedAt: dto.pvp ? null : new Date(),
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

    // Direct challenge: notify + push the opponent so they can load the join screen.
    if (dto.pvp && dto.opponentUserId) {
      const hostName =
        user.displayName ?? user.username ?? user.walletAddress.slice(0, 8);
      const stakeLabel = dto.stake > 0 ? ` · ${dto.stake} coins` : '';

      await this.notifications.notify(dto.opponentUserId, {
        type: NotificationType.Duel,
        title: 'Duel challenge',
        body: `${hostName} challenged you${stakeLabel}`,
        href: `/duel/join/${duel.id}`,
      });

      this.userGateway.emitToUser(dto.opponentUserId, UserEvent.DuelInvite, {
        duelId: duel.id,
        hostId: userId,
        hostName,
        stake: dto.stake,
      });
    }

    return { duel: DuelDto.fromEntity(duel), balance: balance.toFixed(2) };
  }

  async enterMatchmaking(
    userId: string,
    dto: EnterMatchmakingDto,
  ): Promise<{ status: 'queued' | 'matched'; duelId?: string }> {
    await this.assertLineupOwnership(userId, dto.ownedCardIds);

    const opponent = [...this.matchmakingQueue.values()]
      .filter((entry) => entry.userId !== userId)
      .sort((a, b) => a.queuedAt - b.queuedAt)[0];

    if (!opponent) {
      this.matchmakingQueue.set(userId, {
        userId,
        formation: dto.formation,
        ownedCardIds: dto.ownedCardIds,
        queuedAt: Date.now(),
      });
      return { status: 'queued' };
    }

    this.matchmakingQueue.delete(opponent.userId);
    this.matchmakingQueue.delete(userId);

    const duel = await this.duels.create({
      host: { connect: { id: opponent.userId } },
      guest: { connect: { id: userId } },
      mode: DuelMode.Ranked,
      status: DuelStatus.Live,
      stake: 0,
      startedAt: new Date(),
    });

    await Promise.all([
      this.duels.addLineup({
        duel: { connect: { id: duel.id } },
        user: { connect: { id: opponent.userId } },
        lineupSnapshot: {
          formation: opponent.formation,
          ownedCardIds: opponent.ownedCardIds,
          opponentName: null,
        },
      }),
      this.duels.addLineup({
        duel: { connect: { id: duel.id } },
        user: { connect: { id: userId } },
        lineupSnapshot: {
          formation: dto.formation,
          ownedCardIds: dto.ownedCardIds,
          opponentName: null,
        },
      }),
    ]);

    const readyPayload = { duelId: duel.id };
    this.userGateway.emitToUser(
      opponent.userId,
      UserEvent.DuelReady,
      readyPayload,
    );
    this.userGateway.emitToUser(userId, UserEvent.DuelReady, readyPayload);

    return { status: 'matched', duelId: duel.id };
  }

  leaveMatchmaking(userId: string): void {
    this.matchmakingQueue.delete(userId);
  }

  /**
   * A second real player joins an open (Pending) PvP duel with their own XI.
   * Debits the guest stake, freezes their lineup, flips the duel Live, and —
   * once both wallets are known — emits `duel-ready.after` so the chain layer
   * can initialise the on-chain escrow (no-op when chain is disabled).
   * Also pushes `duel:ready` to BOTH players so their clients can enter the arena.
   */
  async join(
    userId: string,
    duelId: string,
    dto: JoinDuelDto,
  ): Promise<DuelResultDto> {
    const duel = await this.duels.findById(duelId);
    if (!duel) throw new NotFoundException('Duel not found');
    if (duel.status !== DuelStatus.Pending || duel.guestId) {
      throw new BadRequestException('Duel is not open to join');
    }
    if (duel.hostId === userId)
      throw new BadRequestException('You cannot join your own duel');

    const guest = await this.users.findById(userId);
    if (!guest) throw new NotFoundException('User not found');
    const stake = Number(duel.stake);
    if (stake > 0 && Number(guest.balance) < stake) {
      throw new BadRequestException('Not enough coins for this stake');
    }

    const ownedIds = new Set(
      (await this.owned.findByUser(userId)).map((oc: OwnedCard) => oc.id),
    );
    if (!dto.ownedCardIds.every((id) => ownedIds.has(id))) {
      throw new ForbiddenException('A fielded card is not in your collection');
    }

    let balance = guest.balance;
    if (stake > 0) {
      const debited = await this.users.adjustBalance(userId, -stake);
      balance = debited.balance;
      await this.wallet.record({
        user: { connect: { id: userId } },
        type: WalletTxType.DuelStake,
        amount: -stake,
        balanceAfter: debited.balance,
        refType: 'duel',
        refId: duelId,
      });
    }

    await this.duels.addLineup({
      duel: { connect: { id: duelId } },
      user: { connect: { id: userId } },
      lineupSnapshot: {
        formation: dto.formation,
        ownedCardIds: dto.ownedCardIds,
        opponentName: null,
      },
    });

    const joined = await this.duels.joinGuest(duelId, userId);

    // Trigger the on-chain escrow only when BOTH players have real wallets.
    const host = await this.users.findById(duel.hostId);
    if (host?.walletAddress && guest.walletAddress) {
      const payload: DuelReadyPayload = {
        duelId,
        hostWallet: host.walletAddress,
        guestWallet: guest.walletAddress,
        stake,
      };
      this.events.emit(EventName.DuelReadyAfter, payload);
    }

    // Push duel:ready to BOTH players so their clients can navigate to the arena.
    const readyPayload = { duelId };
    this.userGateway.emitToUser(duel.hostId, UserEvent.DuelReady, readyPayload);
    this.userGateway.emitToUser(userId, UserEvent.DuelReady, readyPayload);

    return { duel: DuelDto.fromEntity(joined), balance: balance.toFixed(2) };
  }

  /**
   * Settle a duel. The caller must be the host.
   *
   * For vs-CPU duels (guestId null) the existing single-sided behaviour is kept.
   * For real PvP duels (guestId set) both sides are settled atomically:
   *   - guest result = inverse of host result.
   *   - guest wallet credited accordingly.
   *   - guest MMR updated.
   *   - guest receives a notification + `duel:settled` push.
   *
   * Guard: throws if status is already Finished (idempotent-safe).
   * DuelSettledAfter (on-chain trigger) is always emitted last, fire-and-forget.
   */
  async settle(
    userId: string,
    duelId: string,
    dto: SettleDuelDto,
  ): Promise<DuelResultDto> {
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
      winner:
        dto.result === DuelResult.Win ? { connect: { id: userId } } : undefined,
      hostResult: dto.result,
      mmrDelta,
    });
    await this.users.recordDuelOutcome(userId, dto.result, mmrDelta);

    // Win → 2× stake back (net +stake); Draw → refund stake; Loss → nothing.
    const stake = Number(duel.stake);
    const hostCredit =
      dto.result === DuelResult.Win
        ? stake * 2
        : dto.result === DuelResult.Draw
          ? stake
          : 0;
    let balance = (await this.users.findById(userId))!.balance;
    if (hostCredit > 0) {
      const rewarded = await this.users.adjustBalance(userId, hostCredit);
      balance = rewarded.balance;
      await this.wallet.record({
        user: { connect: { id: userId } },
        type: WalletTxType.DuelReward,
        amount: hostCredit,
        balanceAfter: rewarded.balance,
        refType: 'duel',
        refId: duelId,
      });
    }

    const hostTitle =
      dto.result === DuelResult.Win
        ? 'Duel won'
        : dto.result === DuelResult.Draw
          ? 'Duel drawn'
          : 'Duel lost';
    const scoreLabel = `${dto.hostScore}–${dto.guestScore}`;
    const mmrLabel =
      mmrDelta !== 0 ? ` · ${mmrDelta > 0 ? '+' : ''}${mmrDelta} MMR` : '';

    await this.notifications.notify(userId, {
      type: NotificationType.Duel,
      title: hostTitle,
      body: `${scoreLabel}${mmrLabel}`,
      href: '/profile',
    });

    // ── Guest-side settlement (PvP only) ──────────────────────────────────────
    if (duel.guestId) {
      const guestResult =
        dto.result === DuelResult.Win
          ? DuelResult.Loss
          : dto.result === DuelResult.Loss
            ? DuelResult.Win
            : DuelResult.Draw;

      const guestMmrDelta = -mmrDelta; // mirror: host Win (+delta) → guest Loss (-delta)
      await this.users.recordDuelOutcome(
        duel.guestId,
        guestResult,
        guestMmrDelta,
      );

      const guestCredit =
        guestResult === DuelResult.Win
          ? stake * 2
          : guestResult === DuelResult.Draw
            ? stake
            : 0;
      if (guestCredit > 0) {
        const guestRewarded = await this.users.adjustBalance(
          duel.guestId,
          guestCredit,
        );
        await this.wallet.record({
          user: { connect: { id: duel.guestId } },
          type: WalletTxType.DuelReward,
          amount: guestCredit,
          balanceAfter: guestRewarded.balance,
          refType: 'duel',
          refId: duelId,
        });
      }

      const guestTitle =
        guestResult === DuelResult.Win
          ? 'Duel won'
          : guestResult === DuelResult.Draw
            ? 'Duel drawn'
            : 'Duel lost';
      const guestMmrLabel =
        guestMmrDelta !== 0
          ? ` · ${guestMmrDelta > 0 ? '+' : ''}${guestMmrDelta} MMR`
          : '';

      await this.notifications.notify(duel.guestId, {
        type: NotificationType.Duel,
        title: guestTitle,
        body: `${scoreLabel}${guestMmrLabel}`,
        href: '/profile',
      });

      this.userGateway.emitToUser(duel.guestId, UserEvent.DuelSettled, {
        duelId,
        hostScore: dto.hostScore,
        guestScore: dto.guestScore,
        guestResult,
      });
    }

    // Mirror to the on-chain fantasy escrow (no-op when chain is disabled or the
    // opponent was CPU — DuelChainService gates on both). Fire-and-forget: chain
    // failures must not fail the off-chain settle.
    const chainPayload: DuelFinishedPayload = {
      duelId,
      hostId: duel.hostId,
      guestId: duel.guestId,
      hostResult: dto.result,
      hostScore: dto.hostScore,
      guestScore: dto.guestScore,
      stake,
    };
    this.events.emit(EventName.DuelSettledAfter, chainPayload);

    return { duel: DuelDto.fromEntity(finished), balance: balance.toFixed(2) };
  }

  /**
   * Load the full duel detail for both players (join screen, waiting screen, arena).
   *
   * Access rules:
   *  - Pending duel (guestId null): any authenticated user may read so the invitee
   *    can load the join screen before accepting.
   *  - Live/Finished/Cancelled duel: restricted to host and guest.
   */
  async get(userId: string, duelId: string): Promise<DuelDetailDto> {
    const duel = await this.duels.findById(duelId);
    if (!duel) throw new NotFoundException('Duel not found');

    const isPending = duel.status === DuelStatus.Pending;
    const isParticipant = duel.hostId === userId || duel.guestId === userId;

    if (!isPending && !isParticipant) {
      throw new ForbiddenException('Access denied');
    }

    const [hostUser, guestUser] = await Promise.all([
      this.users.findById(duel.hostId),
      duel.guestId ? this.users.findById(duel.guestId) : Promise.resolve(null),
    ]);

    if (!hostUser) throw new NotFoundException('Host user not found');

    // Split lineups by userId from the included relation.
    type LineupRow = { userId: string; lineupSnapshot: unknown };
    const lineups =
      (duel as unknown as { lineups?: LineupRow[] }).lineups ?? [];

    const toLineupDto = (snapshot: unknown): DuelLineupSnapshotDto | null => {
      if (!snapshot) return null;
      const s = snapshot as {
        formation?: string;
        ownedCardIds?: string[];
        opponentName?: string;
      };
      const dto = new DuelLineupSnapshotDto();
      dto.formation = s.formation ?? null;
      dto.ownedCardIds = s.ownedCardIds ?? [];
      dto.opponentName = s.opponentName ?? null;
      return dto;
    };

    const hostLineupRow = lineups.find((l) => l.userId === duel.hostId);
    const guestLineupRow = duel.guestId
      ? lineups.find((l) => l.userId === duel.guestId)
      : undefined;

    const detail = new DuelDetailDto();
    detail.id = duel.id;
    detail.mode = duel.mode;
    detail.status = duel.status;
    detail.stake = duel.stake.toFixed(2);
    detail.hostScore = duel.hostScore;
    detail.guestScore = duel.guestScore;
    detail.winnerId = duel.winnerId;
    detail.hostResult = duel.hostResult;
    detail.mmrDelta = duel.mmrDelta;
    detail.createdAt = duel.createdAt;
    detail.finishedAt = duel.finishedAt;
    detail.host = DuelPlayerDto.fromUser(hostUser);
    detail.guest = guestUser ? DuelPlayerDto.fromUser(guestUser) : null;
    detail.hostLineup = hostLineupRow
      ? toLineupDto(hostLineupRow.lineupSnapshot)
      : null;
    detail.guestLineup = guestLineupRow
      ? toLineupDto(guestLineupRow.lineupSnapshot)
      : null;

    return detail;
  }

  private async assertLineupOwnership(
    userId: string,
    ownedCardIds: string[],
  ): Promise<void> {
    const ownedIds = new Set(
      (await this.owned.findByUser(userId)).map((oc: OwnedCard) => oc.id),
    );
    if (!ownedCardIds.every((id) => ownedIds.has(id))) {
      throw new ForbiddenException('A fielded card is not in your collection');
    }
  }
}
