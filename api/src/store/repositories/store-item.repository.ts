import { Injectable } from '@nestjs/common';
import type { StoreItem } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoreItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActive(): Promise<StoreItem[]> {
    return this.prisma.storeItem.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findBySlug(slug: string): Promise<StoreItem | null> {
    return this.prisma.storeItem.findUnique({ where: { slug } });
  }

  /**
   * Claim one unit atomically — the `stock > 0` guard inside the UPDATE makes
   * concurrent buyers race safely; returns false when the item is sold out.
   */
  async claimUnit(slug: string): Promise<boolean> {
    const { count } = await this.prisma.storeItem.updateMany({
      where: { slug, isActive: true, stock: { gt: 0 } },
      data: { stock: { decrement: 1 } },
    });
    return count > 0;
  }
}
