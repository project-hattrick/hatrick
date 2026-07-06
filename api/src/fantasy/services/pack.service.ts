import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AcquisitionSource,
  PackType,
  WalletTxType,
  type CardCatalog,
} from '@prisma/client';

import { UserRepository, WalletRepository } from '../../users/repositories';
import { CardRepository, OwnedCardRepository, PackRepository } from '../repositories';
import { CardDto } from '../dto/card.dto';
import { PackResultDto } from '../dto/open-pack.dto';
import { PACK_SPECS } from '../fantasy.constants';

/**
 * Server-authoritative pack opening. The server draws from card_catalog, mints the
 * OwnedCards, and moves coins through the wallet ledger (PackPurchase) so the draw
 * and the economy are both authoritative. Mirrors the betting.service ledger pattern.
 */
@Injectable()
export class PackService {
  constructor(
    private readonly cards: CardRepository,
    private readonly owned: OwnedCardRepository,
    private readonly packs: PackRepository,
    private readonly users: UserRepository,
    private readonly wallet: WalletRepository,
  ) {}

  /** The signed-in user's owned cards (catalog details + owned copy id). */
  async collection(userId: string): Promise<CardDto[]> {
    const rows = await this.owned.findByUser(userId);
    return rows.map((row) =>
      CardDto.fromCatalog((row as typeof row & { card: CardCatalog }).card, row.id),
    );
  }

  async open(userId: string, type: PackType): Promise<PackResultDto> {
    const spec = PACK_SPECS[type];
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (type === PackType.Welcome) {
      const existing = await this.owned.findByUser(userId);
      if (existing.length > 0) {
        throw new BadRequestException('Welcome pack already claimed');
      }
    }
    if (spec.cost > 0 && Number(user.balance) < spec.cost) {
      throw new BadRequestException('Not enough coins for this pack');
    }

    const drawn = this.draw(await this.cards.findAll(), spec.size);
    if (drawn.length === 0) {
      throw new BadRequestException('Card catalog is empty — run the seed');
    }

    const packOpening = await this.packs.create({
      user: { connect: { id: userId } },
      type,
      size: drawn.length,
      costPaid: spec.cost > 0 ? spec.cost : null,
    });

    const acquiredVia =
      type === PackType.Welcome ? AcquisitionSource.WelcomePack : AcquisitionSource.Pack;
    const cards: CardDto[] = [];
    for (const card of drawn) {
      const oc = await this.owned.create({
        user: { connect: { id: userId } },
        card: { connect: { id: card.id } },
        acquiredVia,
        packOpening: { connect: { id: packOpening.id } },
      });
      cards.push(CardDto.fromCatalog(card, oc.id));
    }

    let balance = user.balance;
    if (spec.cost > 0) {
      const debited = await this.users.adjustBalance(userId, -spec.cost);
      balance = debited.balance;
      await this.wallet.record({
        user: { connect: { id: userId } },
        type: WalletTxType.PackPurchase,
        amount: -spec.cost,
        balanceAfter: debited.balance,
        refType: 'pack',
        refId: packOpening.id,
      });
    }

    return { cards, balance: balance.toFixed(2) };
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
