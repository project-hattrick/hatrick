import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, type CardCatalog, type OwnedCard } from '@prisma/client';

import { OwnedCardRepository, SquadRepository } from '../repositories';
import { CardDto } from '../dto/card.dto';
import {
  SaveSquadDto,
  SquadDto,
  formationToShape,
  shapeToFormation,
} from '../dto/save-squad.dto';

type OwnedWithCard = OwnedCard & { card: CardCatalog };
type ActiveSquad = Prisma.SquadGetPayload<{
  include: { slots: { include: { ownedCard: { include: { card: true } } } } };
}>;

/** The user's active XI: load it, or replace it from a set of owned cards. */
@Injectable()
export class SquadService {
  constructor(
    private readonly squads: SquadRepository,
    private readonly owned: OwnedCardRepository,
  ) {}

  async getActive(userId: string): Promise<SquadDto | null> {
    const squad = (await this.squads.findActive(userId)) as ActiveSquad | null;
    return squad ? this.toDto(squad) : null;
  }

  async saveActive(userId: string, dto: SaveSquadDto): Promise<SquadDto> {
    // Resolve owned cards for ownership + each card's position (server-derived slot position).
    const ownedList = (await this.owned.findByUser(userId)) as OwnedWithCard[];
    const byId = new Map(ownedList.map((oc) => [oc.id, oc]));

    const slots = dto.ownedCardIds.map((ownedCardId, slotIndex) => {
      const oc = byId.get(ownedCardId);
      if (!oc) throw new ForbiddenException('A selected card is not in your collection');
      return { ownedCardId, slotIndex, position: oc.card.position };
    });

    const formation = shapeToFormation(dto.formation);
    const existing = await this.squads.findActive(userId);
    const squad = existing
      ? await this.squads.update(existing.id, { formation })
      : await this.squads.create({
          user: { connect: { id: userId } },
          formation,
          isActive: true,
        });

    await this.squads.replaceSlots(squad.id, slots);
    // Re-read with nested cards for the response.
    return this.toDto((await this.squads.findActive(userId)) as ActiveSquad);
  }

  private toDto(squad: ActiveSquad): SquadDto {
    return {
      id: squad.id,
      formation: formationToShape(squad.formation),
      slots: squad.slots
        .sort((a, b) => a.slotIndex - b.slotIndex)
        .map((slot) => ({
          slotIndex: slot.slotIndex,
          position: slot.position,
          card: CardDto.fromCatalog(slot.ownedCard.card, slot.ownedCardId),
        })),
    };
  }
}
