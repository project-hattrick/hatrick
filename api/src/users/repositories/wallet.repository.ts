import { Injectable } from '@nestjs/common';
import { type WalletTransaction, type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Sole owner of `wallet_transactions` access — the auditable ledger. */
@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Records one signed movement and returns the new balance snapshot. */
  record(data: Prisma.WalletTransactionCreateInput): Promise<WalletTransaction> {
    return this.prisma.walletTransaction.create({ data });
  }

  findByUser(userId: string, take = 50): Promise<WalletTransaction[]> {
    return this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  latest(userId: string): Promise<WalletTransaction | null> {
    return this.prisma.walletTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
