import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DuelMode, DuelResult, DuelStatus, type Duel, type DuelLineup } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateDuelDto {
  @ApiProperty({ description: 'Coin stake (0 = friendly)', example: 0 })
  @IsInt()
  @Min(0)
  stake!: number;

  @ApiPropertyOptional({ description: 'Opponent persona name (vs CPU)' })
  @IsString()
  @IsOptional()
  opponentName?: string;

  @ApiProperty({ description: 'Duel mode', enum: DuelMode })
  @IsEnum(DuelMode)
  mode!: DuelMode;

  @ApiProperty({ description: 'Formation shape, e.g. "4-3-3"', example: '4-3-3' })
  @IsString()
  @Matches(/^\d-\d-\d$/)
  formation!: string;

  @ApiProperty({ description: 'Owned card ids in the fielded XI', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(11)
  @IsString({ each: true })
  ownedCardIds!: string[];
}

export class SettleDuelDto {
  @ApiProperty({ example: 3 }) @IsInt() @Min(0) hostScore!: number;
  @ApiProperty({ example: 1 }) @IsInt() @Min(0) guestScore!: number;
  @ApiProperty({ enum: DuelResult }) @IsEnum(DuelResult) result!: DuelResult;
}

/** Duel row optionally carrying its frozen lineups (host lineup holds the opponent name). */
type DuelWithLineups = Duel & { lineups?: DuelLineup[] };

export class DuelDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: DuelMode }) mode!: DuelMode;
  @ApiProperty({ enum: DuelStatus }) status!: DuelStatus;
  @ApiProperty({ description: 'Stake (decimal string)' }) stake!: string;
  @ApiProperty() hostScore!: number;
  @ApiProperty() guestScore!: number;
  @ApiProperty({ nullable: true, type: String }) winnerId!: string | null;
  @ApiProperty({ enum: DuelResult, nullable: true }) hostResult!: DuelResult | null;
  @ApiProperty({ description: 'Opponent persona name', nullable: true, type: String })
  opponentName!: string | null;
  @ApiProperty({ description: 'Host MMR change on settle', nullable: true, type: Number })
  mmrDelta!: number | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ nullable: true, type: Date }) finishedAt!: Date | null;

  static fromEntity(duel: DuelWithLineups): DuelDto {
    const dto = new DuelDto();
    dto.id = duel.id;
    dto.mode = duel.mode;
    dto.status = duel.status;
    dto.stake = duel.stake.toFixed(2);
    dto.hostScore = duel.hostScore;
    dto.guestScore = duel.guestScore;
    dto.winnerId = duel.winnerId;
    dto.hostResult = duel.hostResult;
    const snapshot = duel.lineups?.[0]?.lineupSnapshot as { opponentName?: string } | null | undefined;
    dto.opponentName = snapshot?.opponentName ?? null;
    dto.mmrDelta = duel.mmrDelta;
    dto.createdAt = duel.createdAt;
    dto.finishedAt = duel.finishedAt;
    return dto;
  }
}

export class DuelResultDto {
  @ApiProperty({ type: DuelDto }) duel!: DuelDto;
  @ApiProperty({ description: 'Balance after stake/reward (decimal string)' }) balance!: string;
}
