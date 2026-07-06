import { ApiProperty } from '@nestjs/swagger';
import { MarketType } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, IsString, MaxLength, Min } from 'class-validator';

/** Place a play-money bet on a fixture market. */
export class CreateBetDto {
  @ApiProperty({ description: 'TxLINE fixture id', example: 123456 })
  @IsInt()
  fixtureId!: number;

  @ApiProperty({ description: 'Market family', enum: MarketType })
  @IsEnum(MarketType)
  market!: MarketType;

  @ApiProperty({ description: 'Selection id within the market', example: 'home' })
  @IsString()
  @MaxLength(64)
  selection!: string;

  @ApiProperty({ description: 'Stake in coins (whole)', example: 100 })
  @IsInt()
  @Min(1)
  stake!: number;

  @ApiProperty({ description: 'Decimal odds taken', example: 2.5 })
  @IsNumber()
  @Min(1)
  oddsTaken!: number;
}
