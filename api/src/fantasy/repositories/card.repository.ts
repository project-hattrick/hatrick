import { Injectable } from '@nestjs/common';
import { type CardCatalog, type CardAttributeSnapshot, type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

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

  /** Resolve a catalog card by its unique display name (the front↔api join key). */
  findByName(name: string): Promise<CardCatalog | null> {
    return this.prisma.cardCatalog.findFirst({ where: { name } });
  }

  findByRealPlayerId(realPlayerId: number): Promise<CardCatalog[]> {
    return this.prisma.cardCatalog.findMany({ where: { realPlayerId } });
  }

  /** Every card mapped to a real TxLINE player, grouped for the attribute engine (realPlayerId set). */
  findRealPlayerCards(): Promise<CardCatalog[]> {
    return this.prisma.cardCatalog.findMany({ where: { realPlayerId: { not: null } } });
  }

  /** The round snapshot for a card if it exists — the attribute engine's idempotency guard. */
  findSnapshot(cardId: string, roundKey: string): Promise<CardAttributeSnapshot | null> {
    return this.prisma.cardAttributeSnapshot.findUnique({
      where: { cardId_roundKey: { cardId, roundKey } },
    });
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
