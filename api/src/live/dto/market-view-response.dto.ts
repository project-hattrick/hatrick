import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MarketType } from '../../events/enums';

/** Swagger shape for one priced selection (mirrors MarketSelectionView). */
export class MarketSelectionDto {
  @ApiProperty({ description: 'Selection id: home|draw|away or over|under', example: 'home' })
  selection!: string;

  @ApiProperty({ description: 'Decimal odds', example: 1.85 })
  price!: number;
}

/** Swagger shape for a projected tradeable market (mirrors MarketViewPayload). */
export class MarketViewDto {
  @ApiProperty() fixtureId!: number;

  @ApiProperty({ enum: MarketType }) market!: MarketType;

  @ApiPropertyOptional({ description: 'Line qualifier for over/under, e.g. 2.5', example: 2.5 })
  line?: number;

  @ApiProperty({ description: 'Backend can settle this market on match end' })
  settleable!: boolean;

  @ApiProperty({ type: MarketSelectionDto, isArray: true })
  selections!: MarketSelectionDto[];

  @ApiProperty() ts!: number;
}
