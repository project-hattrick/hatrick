import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WalletTxType } from '@prisma/client';

import { UserRepository, WalletRepository } from '../users/repositories';
import { EventName } from '../events/enums/event-name.enum';
import { StoreItemRepository } from './repositories';
import { StoreItemDto, StorePurchaseResultDto } from './dto/store-item.dto';

/**
 * Limited-stock team store. Every purchase claims one unit atomically (the
 * UPDATE guards `stock > 0`, so concurrent buyers cannot oversell), debits the
 * coin balance and writes one ledger row — 0 stock reads as sold out.
 */
@Injectable()
export class StoreService {
  constructor(
    private readonly items: StoreItemRepository,
    private readonly users: UserRepository,
    private readonly wallet: WalletRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async catalog(): Promise<StoreItemDto[]> {
    const items = await this.items.findActive();
    return items.map((item) => StoreItemDto.fromEntity(item));
  }

  async purchase(userId: string, slug: string): Promise<StorePurchaseResultDto> {
    const item = await this.items.findBySlug(slug);
    if (!item || !item.isActive) throw new NotFoundException(`Unknown store item "${slug}"`);

    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const price = Number(item.price);
    if (Number(user.balance) < price) {
      throw new BadRequestException('Not enough coins for this item');
    }

    const claimed = await this.items.claimUnit(slug);
    if (!claimed) throw new BadRequestException('Sold out');

    const updated = await this.users.adjustBalance(userId, -price);
    await this.wallet.record({
      user: { connect: { id: userId } },
      type: WalletTxType.StorePurchase,
      amount: -price,
      balanceAfter: updated.balance,
      refType: 'store-item',
      refId: slug,
    });

    this.eventEmitter.emit(EventName.StorePurchaseAfter, { userId, slug, price });

    const fresh = await this.items.findBySlug(slug);
    return { balance: updated.balance.toFixed(2), stock: fresh?.stock ?? 0, slug };
  }
}
