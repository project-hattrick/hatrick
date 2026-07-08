import { ApiProperty } from '@nestjs/swagger';
import { Presence, RankTier, UserRole, UserStatus, type User } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    description: 'User id (cuid)',
    example: 'cmcg1x2ab0000v8lk3f9d7h2q',
  })
  id!: string;

  @ApiProperty({
    description: 'Solana wallet address',
    example: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  })
  walletAddress!: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'striker@example.com',
    nullable: true,
    type: String,
  })
  email!: string | null;

  @ApiProperty({
    description: 'Public display name',
    example: 'CryptoStriker9',
    nullable: true,
    type: String,
  })
  displayName!: string | null;

  @ApiProperty({
    description: 'Avatar image URL',
    example: 'https://cdn.example.com/a/striker.png',
    nullable: true,
    type: String,
  })
  avatarUrl!: string | null;

  @ApiProperty({ description: 'Unique handle', nullable: true, type: String })
  username!: string | null;

  @ApiProperty({ description: 'Country represented', nullable: true, type: String })
  country!: string | null;

  @ApiProperty({ description: 'Short bio', nullable: true, type: String })
  bio!: string | null;

  @ApiProperty({
    description: 'Avatar source — preset path or URL',
    nullable: true,
    type: String,
  })
  portraitSrc!: string | null;

  @ApiProperty({ description: 'Access level', enum: UserRole })
  role!: UserRole;

  @ApiProperty({ description: 'Account lifecycle state', enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({ description: 'Cached rating', example: 1420 })
  mmr!: number;

  @ApiProperty({ description: 'Competitive tier', enum: RankTier })
  tier!: RankTier;

  @ApiProperty({ description: 'Division within tier', nullable: true, type: String })
  division!: string | null;

  @ApiProperty({ description: 'Duels won', example: 128 })
  wins!: number;

  @ApiProperty({ description: 'Duels lost', example: 74 })
  losses!: number;

  @ApiProperty({ description: 'Current W/L streak, e.g. "W5"', nullable: true, type: String })
  streak!: string | null;

  @ApiProperty({ description: 'Online presence', enum: Presence })
  presence!: Presence;

  @ApiProperty({
    description: 'Play-money balance as a decimal string',
    example: '1000.00',
  })
  balance!: string;

  @ApiProperty({
    description: 'Last sign-in timestamp',
    example: '2026-07-02T12:00:00.000Z',
    nullable: true,
    type: Date,
  })
  lastLoginAt!: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-07-02T12:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-07-02T12:00:00.000Z',
  })
  updatedAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.walletAddress = user.walletAddress;
    dto.email = user.email;
    dto.displayName = user.displayName;
    dto.avatarUrl = user.avatarUrl;
    dto.username = user.username;
    dto.country = user.country;
    dto.bio = user.bio;
    dto.portraitSrc = user.portraitSrc;
    dto.role = user.role;
    dto.status = user.status;
    dto.mmr = user.mmr;
    dto.tier = user.tier;
    dto.division = user.division;
    dto.wins = user.wins;
    dto.losses = user.losses;
    dto.streak = user.streak;
    dto.presence = user.presence;
    dto.balance = user.balance.toFixed(2);
    dto.lastLoginAt = user.lastLoginAt;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
