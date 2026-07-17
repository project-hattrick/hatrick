import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AcquisitionSource, PackType, StoreItemKind, WalletTxType, type CardCatalog } from '@prisma/client';

import { UserRepository, WalletRepository } from '../users/repositories';
import { EventName } from '../events/enums/event-name.enum';
import { CardDto } from '../fantasy/dto/card.dto';
import { CardRepository, OwnedCardRepository, PackRepository } from '../fantasy/repositories';
import { StoreItemRepository } from './repositories';
import { StoreItemDto, StorePurchaseResultDto } from './dto/store-item.dto';

const PACK_REWARDS: Record<string, { size: number; type: PackType }> = {
  'legendary-pack': { size: 5, type: PackType.Special },
  'pro-pack': { size: 11, type: PackType.Premium },
  'starter-pack': { size: 7, type: PackType.Standard },
  'limited-bundle': { size: 5, type: PackType.Special },
  'midfield-bundle': { size: 5, type: PackType.Premium },
};

const CARD_REWARDS: Record<string, string> = {
  'card-mbappe': 'Mbapp\u00e9',
  'card-haaland': 'Haaland',
  'card-messi': 'Messi',
  'card-vini': 'Vini Jr',
  'card-bellingham': 'Bellingham',
};

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
    private readonly cards: CardRepository,
    private readonly owned: OwnedCardRepository,
    private readonly packs: PackRepository,
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

    const rewardPool = await this.resolveRewardPool(item.slug, item.kind);
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

    const cards = await this.mintRewardCards(userId, item.slug, item.kind, price, rewardPool);
    const fresh = await this.items.findBySlug(slug);
    return { balance: updated.balance.toFixed(2), stock: fresh?.stock ?? 0, slug, cards };
  }

  private async resolveRewardPool(slug: string, kind: StoreItemKind): Promise<CardCatalog[]> {
    if (kind === StoreItemKind.Card) {
      const cardName = CARD_REWARDS[slug];
      if (!cardName) throw new NotFoundException(`Unknown card reward "${slug}"`);
      const card = await this.cards.findByName(cardName);
      if (!card) throw new NotFoundException(`Unknown card "${cardName}"`);
      return [card];
    }

    const reward = PACK_REWARDS[slug];
    if (!reward) return [];
    const pool = await this.cards.findAll();
    if (!pool.length) throw new BadRequestException('Card catalog is empty - run the seed');
    return this.draw(pool, reward.size);
  }

  private async mintRewardCards(
    userId: string,
    slug: string,
    kind: StoreItemKind,
    price: number,
    cards: CardCatalog[],
  ): Promise<CardDto[] | undefined> {
    if (!cards.length) return undefined;

    const source = kind === StoreItemKind.Card ? AcquisitionSource.Market : AcquisitionSource.Pack;
    const packReward = PACK_REWARDS[slug];
    const packOpening =
      packReward && kind !== StoreItemKind.Card
        ? await this.packs.create({
            user: { connect: { id: userId } },
            type: packReward.type,
            size: cards.length,
            costPaid: price,
          })
        : null;

    const ownedCards: CardDto[] = [];
    for (const card of cards) {
      const owned = await this.owned.create({
        user: { connect: { id: userId } },
        card: { connect: { id: card.id } },
        acquiredVia: source,
        ...(packOpening ? { packOpening: { connect: { id: packOpening.id } } } : {}),
      });
      ownedCards.push(CardDto.fromCatalog(card, owned.id));
    }
    return ownedCards;
  }

  /** Fisher-Yates draw of `size` distinct catalog cards. */
  private draw(pool: CardCatalog[], size: number): CardCatalog[] {
    const copy = [...pool];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(size, copy.length));
  }
}
