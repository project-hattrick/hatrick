import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DuelMode,
  DuelResult,
  DuelStatus,
  type Duel,
  type DuelLineup,
  type User,
} from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
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

  @ApiPropertyOptional({
    description:
      'Open this as a real 1v1 challenge (Pending, awaiting a second player) instead of a vs-CPU duel. ' +
      'When both players and wallets are known the on-chain escrow is initialised.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  pvp?: boolean;

  @ApiPropertyOptional({
    description:
      'Direct challenge: the user id of the opponent to invite. ' +
      'Only valid together with pvp=true. The opponent receives a notification + socket event.',
    example: 'clxyz123',
  })
  @IsString()
  @IsOptional()
  opponentUserId?: string;

  @ApiProperty({ description: 'Duel mode', enum: DuelMode })
  @IsEnum(DuelMode)
  mode!: DuelMode;

  @ApiProperty({
    description: 'Formation shape, e.g. "4-3-3"',
    example: '4-3-3',
  })
  @IsString()
  @Matches(/^\d-\d-\d$/)
  formation!: string;

  @ApiProperty({
    description: 'Owned card ids in the fielded XI',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(11)
  @IsString({ each: true })
  ownedCardIds!: string[];
}

/** A second player joining an open (Pending) PvP duel with their own XI. */
export class JoinDuelDto {
  @ApiProperty({
    description: 'Formation shape, e.g. "4-3-3"',
    example: '4-3-3',
  })
  @IsString()
  @Matches(/^\d-\d-\d$/)
  formation!: string;

  @ApiProperty({
    description: 'Owned card ids in the fielded XI',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(11)
  @IsString({ each: true })
  ownedCardIds!: string[];
}

/** Enter the ranked matchmaking queue with the player's current XI. */
export class EnterMatchmakingDto extends JoinDuelDto {}

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
  @ApiProperty({ enum: DuelResult, nullable: true })
  hostResult!: DuelResult | null;
  @ApiProperty({
    description: 'Opponent persona name',
    nullable: true,
    type: String,
  })
  opponentName!: string | null;
  @ApiProperty({
    description: 'Host MMR change on settle',
    nullable: true,
    type: Number,
  })
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
    const snapshot = duel.lineups?.[0]?.lineupSnapshot as
      { opponentName?: string } | null | undefined;
    dto.opponentName = snapshot?.opponentName ?? null;
    dto.mmrDelta = duel.mmrDelta;
    dto.createdAt = duel.createdAt;
    dto.finishedAt = duel.finishedAt;
    return dto;
  }
}

export class DuelResultDto {
  @ApiProperty({ type: DuelDto }) duel!: DuelDto;
  @ApiProperty({ description: 'Balance after stake/reward (decimal string)' })
  balance!: string;
}

/** Public profile slice returned inside DuelDetailDto. */
export class DuelPlayerDto {
  @ApiProperty() id!: string;
  @ApiProperty({ nullable: true, type: String }) displayName!: string | null;
  @ApiProperty({ nullable: true, type: String }) username!: string | null;
  @ApiProperty({ nullable: true, type: String }) country!: string | null;
  @ApiProperty({ nullable: true, type: String }) avatarUrl!: string | null;
  @ApiProperty() mmr!: number;

  static fromUser(user: User): DuelPlayerDto {
    const dto = new DuelPlayerDto();
    dto.id = user.id;
    dto.displayName = user.displayName;
    dto.username = user.username;
    dto.country = user.country;
    dto.avatarUrl = user.avatarUrl;
    dto.mmr = user.mmr;
    return dto;
  }
}

/** Frozen lineup for one participant (formation + card ids). */
export class DuelLineupSnapshotDto {
  @ApiProperty({ nullable: true, type: String }) formation!: string | null;
  @ApiProperty({ type: [String] }) ownedCardIds!: string[];
  @ApiProperty({ nullable: true, type: String }) opponentName!: string | null;
}

/**
 * Full duel detail — both players' public profiles + frozen lineups + status.
 * Used by the join screen, waiting screen, and arena loader on both clients.
 */
export class DuelDetailDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: DuelMode }) mode!: DuelMode;
  @ApiProperty({ enum: DuelStatus }) status!: DuelStatus;
  @ApiProperty({ description: 'Stake (decimal string)' }) stake!: string;
  @ApiProperty() hostScore!: number;
  @ApiProperty() guestScore!: number;
  @ApiProperty({ nullable: true, type: String }) winnerId!: string | null;
  @ApiProperty({ enum: DuelResult, nullable: true })
  hostResult!: DuelResult | null;
  @ApiProperty() mmrDelta!: number | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ nullable: true, type: Date }) finishedAt!: Date | null;
  @ApiProperty({ type: DuelPlayerDto }) host!: DuelPlayerDto;
  @ApiProperty({ nullable: true, type: DuelPlayerDto })
  guest!: DuelPlayerDto | null;
  @ApiProperty({ nullable: true, type: DuelLineupSnapshotDto })
  hostLineup!: DuelLineupSnapshotDto | null;
  @ApiProperty({ nullable: true, type: DuelLineupSnapshotDto })
  guestLineup!: DuelLineupSnapshotDto | null;
}
