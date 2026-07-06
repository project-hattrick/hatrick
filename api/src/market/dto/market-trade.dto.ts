import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MaxLength, Min } from 'class-validator';

/** A play-money card trade in the internal market (buy or sell). */
export class MarketTradeDto {
  @ApiProperty({ description: 'Card name traded', example: 'L. Messi' })
  @IsString()
  @MaxLength(80)
  cardName!: string;

  @ApiProperty({ description: 'Price in coins (whole)', example: 250 })
  @IsInt()
  @Min(1)
  price!: number;
}

/** Trade result — the resulting balance so the client can reconcile its wallet. */
export class MarketResultDto {
  @ApiProperty({ description: 'User balance after the trade (decimal string)', example: '28105570.00' })
  balance!: string;
}
