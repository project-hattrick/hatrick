import { Injectable } from '@nestjs/common';
import { type CardCatalog, type CardAttributeSnapshot, type Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/** Sole owner of `card_catalog` + `card_attribute_snapshots` access. */
@Injectable()
export class CardRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CardCatalogCreateInput): Promise<CardCatalog> {
    return this.prisma.cardCatalog.create({ data });
  }

  findById(id: string): Promise<CardCatalog | null> {
    return this.prisma.cardCatalog.findUnique({ where: { id } });
  }

  findByRealPlayerId(realPlayerId: number): Promise<CardCatalog[]> {
    return this.prisma.cardCatalog.findMany({ where: { realPlayerId } });
  }

  findAll(): Promise<CardCatalog[]> {
    return this.prisma.cardCatalog.findMany({ orderBy: { rating: 'desc' } });
  }

  /** Appends a per-round attribute snapshot (idempotent per cardId+roundKey). */
  addSnapshot(data: Prisma.CardAttributeSnapshotCreateInput): Promise<CardAttributeSnapshot> {
    return this.prisma.cardAttributeSnapshot.create({ data });
  }

  updateStats(id: string, stats: Prisma.InputJsonValue, rating: number): Promise<CardCatalog> {
    return this.prisma.cardCatalog.update({ where: { id }, data: { stats, rating } });
  }
}
