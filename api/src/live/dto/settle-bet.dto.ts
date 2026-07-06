import { ApiProperty } from '@nestjs/swagger';
import { BetStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

/** Terminal outcomes a client may report for one of its pending bets. */
export const SETTLEABLE_STATUSES = [BetStatus.Won, BetStatus.Lost, BetStatus.Void] as const;
export type SettleableStatus = (typeof SETTLEABLE_STATUSES)[number];

export class SettleBetDto {
  @ApiProperty({ description: 'Outcome', enum: SETTLEABLE_STATUSES })
  @IsIn(SETTLEABLE_STATUSES)
  status!: SettleableStatus;
}
