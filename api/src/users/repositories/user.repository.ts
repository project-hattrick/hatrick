import { Injectable } from '@nestjs/common';
import { AccountType, DuelResult, Prisma, UserStatus, type User } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { rankFromMmr, nextStreak } from '../../fantasy/ranking.util';
import { WELCOME_GRANT_COINS } from '../user.constants';

/**
 * The ONLY place user rows are read/written. Services depend on this, never on
 * PrismaService directly (docs/conventions.md — "DB access only in repositories").
 *
 * Deletes are SOFT (status=Deleted + deletedAt): reads filter out tombstones by
 * default so bet history and relations survive.
 */
@Injectable()
export class UserRepository {
  /** Excludes soft-deleted rows — spread into every default read. */
  private static readonly notDeleted = { deletedAt: null } satisfies Prisma.UserWhereInput;

  constructor(private readonly prisma: PrismaService) {}

  findByWallet(walletAddress: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { walletAddress, ...UserRepository.notDeleted },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, ...UserRepository.notDeleted },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, ...UserRepository.notDeleted },
    });
  }

  /** Email registration — Collector tier, no real wallet (address is synthetic). */
  createCollector(
    email: string,
    passwordHash: string,
    walletAddress: string,
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        walletAddress,
        accountType: AccountType.Collector,
        balance: WELCOME_GRANT_COINS,
        lastLoginAt: new Date(),
      },
    });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { username, ...UserRepository.notDeleted },
    });
  }

  /**
   * Get-or-create on wallet sign-in (idempotent); stamps last login.
   * `isNew` distinguishes a first-time registration from a returning login so the
   * front can fire onboarding exactly for new accounts.
   */
  async upsertByWallet(
    walletAddress: string,
    displayName?: string,
  ): Promise<{ user: User; isNew: boolean }> {
    const existing = await this.prisma.user.findUnique({ where: { walletAddress } });
    const user = await this.prisma.user.upsert({
      where: { walletAddress },
      update: { lastLoginAt: new Date(), status: UserStatus.Active, deletedAt: null },
      create: { walletAddress, displayName, balance: WELCOME_GRANT_COINS },
    });
    return { user, isNew: !existing };
  }

  adjustBalance(id: string, delta: Prisma.Decimal | number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { balance: { increment: delta } },
    });
  }

  /**
   * Apply a 1v1 outcome to the cached ranking: MMR swing + win/loss tally, then
   * recompute tier/division from the new MMR and extend the streak — so all the
   * denormalized ranking fields stay coherent after every settle.
   */
  async recordDuelOutcome(id: string, result: DuelResult, mmrDelta: number): Promise<User> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    const mmr = user.mmr + mmrDelta;
    const { tier, division } = rankFromMmr(mmr);
    return this.prisma.user.update({
      where: { id },
      data: {
        mmr,
        tier,
        division,
        streak: nextStreak(user.streak, result),
        wins: result === DuelResult.Win ? { increment: 1 } : undefined,
        losses: result === DuelResult.Loss ? { increment: 1 } : undefined,
      },
    });
  }

  touchLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  create(data: {
    walletAddress: string;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /** Returns the requested page (excluding tombstones) plus the total count. */
  findMany(skip: number, take: number): Promise<[User[], number]> {
    return this.prisma.$transaction([
      this.prisma.user.findMany({
        where: UserRepository.notDeleted,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: UserRepository.notDeleted }),
    ]);
  }

  update(
    id: string,
    data: {
      displayName?: string;
      email?: string;
      avatarUrl?: string;
      username?: string;
      country?: string;
      bio?: string;
      portraitSrc?: string;
    },
  ): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  /** Soft delete — tombstones the row instead of removing it. */
  softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.Deleted, deletedAt: new Date() },
    });
  }
}
