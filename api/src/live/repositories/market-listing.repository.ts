import { Injectable } from '@nestjs/common';
import { ListingStatus, type MarketListing, type Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/** Sole owner of `market_listings` access — the card marketplace. */
@Injectable()
export class MarketListingRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.MarketListingCreateInput): Promise<MarketListing> {
    return this.prisma.marketListing.create({ data });
  }

  findById(id: string): Promise<MarketListing | null> {
    return this.prisma.marketListing.findUnique({ where: { id } });
  }

  findActive(): Promise<MarketListing[]> {
    return this.prisma.marketListing.findMany({
      where: { status: ListingStatus.Active },
      include: { ownedCard: { include: { card: true } } },
      orderBy: { listedAt: 'desc' },
    });
  }

  markSold(id: string, buyerId: string): Promise<MarketListing> {
    return this.prisma.marketListing.update({
      where: { id },
      data: { status: ListingStatus.Sold, buyerId, soldAt: new Date() },
    });
  }

  cancel(id: string): Promise<MarketListing> {
    return this.prisma.marketListing.update({
      where: { id },
      data: { status: ListingStatus.Cancelled },
    });
  }
}
