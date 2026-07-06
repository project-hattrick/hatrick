import { ApiProperty } from '@nestjs/swagger';
import { Formation, PlayerPosition } from '@prisma/client';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, Matches } from 'class-validator';

import { CardDto } from './card.dto';

export class SaveSquadDto {
  @ApiProperty({ description: 'Formation shape, e.g. "4-3-3"', example: '4-3-3' })
  @IsString()
  @Matches(/^\d-\d-\d$/, { message: 'formation must look like "4-3-3"' })
  formation!: string;

  @ApiProperty({ description: 'Owned card ids in slot order', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(11)
  @IsString({ each: true })
  ownedCardIds!: string[];
}

export class SquadSlotDto {
  @ApiProperty() slotIndex!: number;
  @ApiProperty({ enum: PlayerPosition }) position!: PlayerPosition;
  @ApiProperty({ type: CardDto }) card!: CardDto;
}

export class SquadDto {
  @ApiProperty() id!: string;
  @ApiProperty({ description: 'Formation shape, e.g. "4-3-3"' }) formation!: string;
  @ApiProperty({ type: [SquadSlotDto] }) slots!: SquadSlotDto[];
}

/** Prisma Formation enum ("F_4_3_3") ↔ front shape string ("4-3-3"). */
export const formationToShape = (f: Formation): string => f.replace(/^F_/, '').replace(/_/g, '-');
export const shapeToFormation = (shape: string): Formation =>
  (`F_${shape.replace(/-/g, '_')}` as Formation);
