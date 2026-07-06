import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CardRarity, PlayerPosition, type CardCatalog } from '@prisma/client';

/** A card as the client consumes it — catalog fields plus the owned copy id (when owned). */
export class CardDto {
  @ApiPropertyOptional({ description: 'Owned copy id (present for collection/pack results)' })
  ownedCardId?: string;

  @ApiProperty({ description: 'Catalog card id (cuid)' })
  cardId!: string;

  @ApiProperty({ description: 'Player/persona name (join key with the front pool)' })
  name!: string;

  @ApiProperty({ description: 'Overall rating' })
  rating!: number;

  @ApiProperty({ description: 'Field position', enum: PlayerPosition })
  position!: PlayerPosition;

  @ApiProperty({ description: 'Rarity tier', enum: CardRarity })
  rarity!: CardRarity;

  @ApiProperty({ description: 'Six attributes { pac, sho, pas, dri, def, phy }' })
  stats!: Record<string, number>;

  @ApiProperty({ nullable: true, type: String })
  country!: string | null;

  @ApiProperty({ nullable: true, type: String })
  code!: string | null;

  @ApiProperty({ nullable: true, type: String })
  flag!: string | null;

  @ApiProperty({ description: 'Holo refraction palette', nullable: true, type: [String] })
  holoColors!: string[] | null;

  @ApiProperty({ nullable: true, type: String })
  portraitSrc!: string | null;

  static fromCatalog(card: CardCatalog, ownedCardId?: string): CardDto {
    const dto = new CardDto();
    dto.ownedCardId = ownedCardId;
    dto.cardId = card.id;
    dto.name = card.name;
    dto.rating = card.rating;
    dto.position = card.position;
    dto.rarity = card.rarity;
    dto.stats = (card.stats ?? {}) as Record<string, number>;
    dto.country = card.country;
    dto.code = card.code;
    dto.flag = card.flag;
    dto.holoColors = (card.holoColors ?? null) as string[] | null;
    dto.portraitSrc = card.portraitSrc;
    return dto;
  }
}
