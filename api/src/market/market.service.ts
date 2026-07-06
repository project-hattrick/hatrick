import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AcquisitionSource, WalletTxType, type CardCatalog, type OwnedCard } from '@prisma/client';

import { UserRepository, WalletRepository } from '../users/repositories';
import { CardRepository, OwnedCardRepository } from '../fantasy/repositories';
import { MarketResultDto, MarketTradeDto } from './dto/market-trade.dto';

/**
 * Play-money card market. Buys/sells move coins through the wallet ledger AND mutate
 * the relational collection (owned_cards) so the server-sourced collection stays
 * consistent: a buy mints an owned copy, a sell burns one.
 */
@Injectable()
export class MarketService {
  constructor(
    private readonly users: UserRepository,
    private readonly wallet: WalletRepository,
    private readonly cards: CardRepository,
    private readonly owned: OwnedCardRepository,
  ) {}

  async buy(userId: string, dto: MarketTradeDto): Promise<MarketResultDto> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (Number(user.balance) < dto.price) {
      throw new BadRequestException('Not enough coins for this card');
    }
    const card = await this.cards.findByName(dto.cardName);
    if (!card) throw new NotFoundException(`Unknown card "${dto.cardName}"`);

    await this.owned.create({
      user: { connect: { id: userId } },
      card: { connect: { id: card.id } },
      acquiredVia: AcquisitionSource.Market,
    });
    return this.move(userId, WalletTxType.MarketPurchase, -dto.price, dto.cardName);
  }

  async sell(userId: string, dto: MarketTradeDto): Promise<MarketResultDto> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Burn one owned copy of that card (no-op if the user doesn't hold it).
    const owned = (await this.owned.findByUser(userId)) as Array<OwnedCard & { card: CardCatalog }>;
    const copy = owned.find((oc) => oc.card.name === dto.cardName);
    if (copy) await this.owned.delete(copy.id);

    return this.move(userId, WalletTxType.MarketSale, dto.price, dto.cardName);
  }

  /** Apply one signed movement + ledger entry, return the new balance. */
  private async move(
    userId: string,
    type: WalletTxType,
    amount: number,
    cardName: string,
  ): Promise<MarketResultDto> {
    const updated = await this.users.adjustBalance(userId, amount);
    await this.wallet.record({
      user: { connect: { id: userId } },
      type,
      amount,
      balanceAfter: updated.balance,
      refType: 'card',
      refId: cardName,
    });
    return { balance: updated.balance.toFixed(2) };
  }
}
