import { Injectable } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * The ONLY place user rows are read/written. Services depend on this, never on
 * PrismaService directly (docs/conventions.md — "DB access only in repositories").
 */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByWallet(walletAddress: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { walletAddress } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Get-or-create on wallet sign-in (idempotent). */
  upsertByWallet(walletAddress: string, displayName?: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress, displayName },
    });
  }

  adjustBalance(id: string, delta: Prisma.Decimal | number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { balance: { increment: delta } },
    });
  }

  create(data: { walletAddress: string; displayName?: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  /** Returns the requested page plus the total row count in one transaction. */
  findMany(skip: number, take: number): Promise<[User[], number]> {
    return this.prisma.$transaction([
      this.prisma.user.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count(),
    ]);
  }

  update(
    id: string,
    data: { walletAddress?: string; displayName?: string },
  ): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  delete(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }
}
