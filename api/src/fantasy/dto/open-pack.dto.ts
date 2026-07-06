import { ApiProperty } from '@nestjs/swagger';
import { PackType } from '@prisma/client';
import { IsEnum } from 'class-validator';

import { CardDto } from './card.dto';

export class OpenPackDto {
  @ApiProperty({ description: 'Pack tier', enum: PackType })
  @IsEnum(PackType)
  type!: PackType;
}

export class PackResultDto {
  @ApiProperty({ description: 'The drawn cards (each with its owned copy id)', type: [CardDto] })
  cards!: CardDto[];

  @ApiProperty({ description: 'Balance after the purchase (decimal string)', example: '27855820.00' })
  balance!: string;
}
