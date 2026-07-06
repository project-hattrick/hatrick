import { ApiProperty } from '@nestjs/swagger';
import { BetStatus, MarketType, type Bet } from '@prisma/client';

export class BetResponseDto {
  @ApiProperty({ description: 'Bet id (cuid)' })
  id!: string;

  @ApiProperty({ description: 'TxLINE fixture id' })
  fixtureId!: number;

  @ApiProperty({ description: 'Market family', enum: MarketType })
  market!: MarketType;

  @ApiProperty({ description: 'Selection id' })
  selection!: string;

  @ApiProperty({ description: 'Stake in coins (decimal string)', example: '100.00' })
  stake!: string;

  @ApiProperty({ description: 'Decimal odds taken', example: '2.500' })
  oddsTaken!: string;

  @ApiProperty({ description: 'Lifecycle status', enum: BetStatus })
  status!: BetStatus;

  @ApiProperty({ description: 'When placed' })
  placedAt!: Date;

  @ApiProperty({ description: 'When settled', nullable: true, type: Date })
  settledAt!: Date | null;

  static fromEntity(bet: Bet): BetResponseDto {
    const dto = new BetResponseDto();
    dto.id = bet.id;
    dto.fixtureId = bet.fixtureId;
    dto.market = bet.market;
    dto.selection = bet.selection;
    dto.stake = bet.stake.toFixed(2);
    dto.oddsTaken = bet.oddsTaken.toFixed(3);
    dto.status = bet.status;
    dto.placedAt = bet.placedAt;
    dto.settledAt = bet.settledAt;
    return dto;
  }
}

/** A bet mutation echoes the resulting balance so the client can reconcile its wallet. */
export class BetResultDto {
  @ApiProperty({ type: BetResponseDto })
  bet!: BetResponseDto;

  @ApiProperty({ description: 'User balance after the movement (decimal string)', example: '28105720.00' })
  balance!: string;
}
